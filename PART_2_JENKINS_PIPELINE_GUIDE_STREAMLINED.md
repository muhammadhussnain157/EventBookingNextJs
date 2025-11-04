# Part-II: Jenkins CI/CD Pipeline for Event Booking App

## Streamlined Guide for EC2 Linux Deployment

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: GitHub Repository Setup](#phase-1-github-repository-setup)
4. [Phase 2: AWS EC2 Setup for Jenkins](#phase-2-aws-ec2-setup-for-jenkins)
5. [Phase 3: Install and Configure Jenkins](#phase-3-install-and-configure-jenkins)
6. [Phase 4: Install Required Plugins](#phase-4-install-required-plugins)
7. [Phase 5: Configure Docker Credentials](#phase-5-configure-docker-credentials)
8. [Phase 6: Create Jenkins Pipeline](#phase-6-create-jenkins-pipeline)
9. [Phase 7: Write Jenkinsfile](#phase-7-write-jenkinsfile)
10. [Phase 8: Update docker-compose.yml for Volume Mounting](#phase-8-update-docker-composeyml-for-volume-mounting)
11. [Phase 9: Run Pipeline](#phase-9-run-pipeline)

---

## 🎯 Overview

### What You Will Accomplish

- ✅ Push Event Booking code to GitHub
- ✅ Install Jenkins on AWS EC2 (Linux)
- ✅ Integrate Git, Pipeline, and Docker Pipeline plugins
- ✅ Create automated pipeline to fetch code from GitHub
- ✅ Build application in containerized environment
- ✅ Use volume mounting instead of Dockerfile for code
- ✅ Run containers on different ports

### Assignment Requirements

This assignment focuses on:
1. **Jenkins automation**: Fetch code from GitHub and build in Docker
2. **Volume mounting**: Attach code volume instead of using Dockerfile
3. **Different ports**: Use ports 3001 (app) and 27018 (MongoDB)
4. **Different container names**: eventbooking-jenkins-web and eventbooking-jenkins-db

---

## 🔧 Prerequisites

- [ ] Completed Part-I or have Event Booking application ready
- [ ] AWS account active
- [ ] GitHub account
- [ ] Docker Hub account
- [ ] SSH client for EC2 access

---

## 📁 Phase 1: GitHub Repository Setup

### Step 1: Create GitHub Repository

1. Go to **https://github.com/**
2. Sign in (or create account if needed)
3. Click **"+"** → **"New repository"**
4. Configure:
   - **Repository name**: `EventBookingNextJs`
   - **Visibility**: Public
   - ✅ Add README file
   - ✅ Add .gitignore → Select "Node"
5. Click **"Create repository"**

### Step 2: Push Code to GitHub

1. Navigate to your project:
   ```bash
   cd ~/projects/EventBookingNextJs
   ```

2. Initialize Git (if not already):
   ```bash
   git init
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```

3. Add and commit:
   ```bash
   git add .
   git commit -m "Initial commit: Event Booking app for Jenkins CI/CD"
   ```

4. Connect to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/EventBookingNextJs.git
   git branch -M main
   git push -u origin main
   ```

   **Note**: You'll need a GitHub Personal Access Token as password:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Use token as password when pushing

**✅ Checkpoint**: Code is on GitHub!

---

## ☁️ Phase 2: AWS EC2 Setup for Jenkins

### Step 3: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**

2. **Configure Instance**:
   - **Name**: `Jenkins-CI-Server`
   - **OS**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.small (minimum for Jenkins)
   - **Key Pair**: Create new → `jenkins-key.pem` (save securely)
   
3. **Network Settings**:
   - ✅ Auto-assign public IP
   - **Security Group**: Create new with these rules:
     - SSH (22) - Source: My IP
     - Custom TCP (8080) - Source: Anywhere (0.0.0.0/0) - Jenkins UI
     - Custom TCP (3001) - Source: Anywhere (0.0.0.0/0) - App
     - HTTP (80) - Source: Anywhere (0.0.0.0/0)

4. **Storage**: 30 GB gp3

5. **User Data** (paste in Advanced Details):
   ```bash
   #!/bin/bash
   apt-get update -y
   apt-get upgrade -y
   
   # Install Java (Jenkins requirement)
   apt-get install -y openjdk-11-jdk
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   usermod -aG docker ubuntu
   
   # Install Docker Compose
   apt-get install -y docker-compose
   
   # Install Git
   apt-get install -y git
   
   # Add Jenkins repository and install
   wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | apt-key add -
   sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
   apt-get update -y
   apt-get install -y jenkins
   
   # Add Jenkins to docker group
   usermod -aG docker jenkins
   
   # Start Jenkins
   systemctl enable jenkins
   systemctl start jenkins
   ```

6. Click **"Launch instance"**

7. Wait 3-5 minutes for instance to initialize

8. **Note down Public IP**: `XX.XX.XX.XX`

**✅ Checkpoint**: EC2 instance running!

---

## 🛠️ Phase 3: Install and Configure Jenkins

### Step 4: Access Jenkins

1. **Connect to EC2 via SSH**:
   ```bash
   ssh -i jenkins-key.pem ubuntu@YOUR_EC2_IP
   ```

2. **Get Jenkins initial password**:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
   Copy this password!

3. **Open Jenkins in browser**:
   ```
   http://YOUR_EC2_IP:8080
   ```

4. **Unlock Jenkins**:
   - Paste the password
   - Click "Continue"

5. **Install Plugins**:
   - Select "Install suggested plugins"
   - Wait for installation (3-5 minutes)

6. **Create Admin User**:
   - Username: `admin`
   - Password: (create strong password)
   - Full name: Your name
   - Email: Your email
   - Click "Save and Continue"

7. **Instance Configuration**:
   - Keep default URL
   - Click "Save and Finish"

8. Click "Start using Jenkins"

**✅ Checkpoint**: Jenkins is running!

---

## 🔌 Phase 4: Install Required Plugins

### Step 5: Install Git, Pipeline, and Docker Pipeline Plugins

1. Go to **"Manage Jenkins"** → **"Plugins"**

2. Click **"Available plugins"** tab

3. Search and install (if not already installed):
   - ✅ **Git plugin**
   - ✅ **GitHub plugin**
   - ✅ **Pipeline**
   - ✅ **Pipeline: Stage View**
   - ✅ **Docker Pipeline**
   - ✅ **Docker plugin**

4. Click **"Install without restart"** or **"Download now and install after restart"**

5. If restarting:
   - Check "Restart Jenkins when installation is complete"
   - Wait 2 minutes
   - Refresh browser and log in again

**✅ Checkpoint**: All plugins installed!

---

## 🔐 Phase 5: Configure Docker Credentials

### Step 6: Add Docker Hub Credentials

1. Go to **"Manage Jenkins"** → **"Credentials"**

2. Click **(global)** under "Stores scoped to Jenkins"

3. Click **"Add Credentials"**

4. Fill in:
   - **Kind**: Username with password
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password
   - **ID**: `dockerhub-credentials` (exact name!)
   - **Description**: Docker Hub login
   - Click "Create"

5. **Verify Jenkins can use Docker** (in SSH terminal):
   ```bash
   sudo -u jenkins docker ps
   ```
   
   If permission denied:
   ```bash
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

**✅ Checkpoint**: Docker credentials configured!

---

## 📋 Phase 6: Create Jenkins Pipeline

### Step 7: Create Pipeline Job

1. From Jenkins Dashboard, click **"New Item"**

2. **Item name**: `EventBooking-Build-Pipeline`

3. Select **"Pipeline"**

4. Click **"OK"**

5. **Configure**:
   - **Description**: `Automated build pipeline for Event Booking app with volume mounting`
   - **Build Triggers**: 
     - ✅ Poll SCM
     - **Schedule**: `H/5 * * * *` (checks GitHub every 5 minutes)

6. Scroll to **Pipeline** section (we'll configure in next step)

**✅ Checkpoint**: Pipeline created!

---

## 📝 Phase 7: Write Jenkinsfile

### Step 8: Create Jenkinsfile

1. Still in pipeline configuration, scroll to **"Pipeline"** section

2. **Definition**: Select "Pipeline script"

3. **Script**: Paste this Jenkinsfile:

```groovy
pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        DOCKER_USERNAME = 'YOUR_DOCKERHUB_USERNAME'  // CHANGE THIS
        GITHUB_REPO = 'https://github.com/YOUR_GITHUB_USERNAME/EventBookingNextJs.git'  // CHANGE THIS
        WORKSPACE_DIR = "${WORKSPACE}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '=========================================='
                echo 'Fetching code from GitHub'
                echo '=========================================='
                
                git branch: 'main', url: "${GITHUB_REPO}"
                
                echo 'Code checkout completed!'
            }
        }

        stage('Build and Run with Docker Compose') {
            steps {
                echo '=========================================='
                echo 'Building and starting containers'
                echo '=========================================='
                
                script {
                    sh """
                        cd ${WORKSPACE_DIR}
                        docker-compose -f docker-compose.jenkins.yml down || true
                        docker-compose -f docker-compose.jenkins.yml up -d --build
                    """
                }
                
                echo 'Containers started successfully!'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '=========================================='
                echo 'Verifying containers are running'
                echo '=========================================='
                
                script {
                    sh """
                        docker ps | grep eventbooking-jenkins
                        docker volume ls | grep eventbooking-jenkins
                    """
                }
                
                echo 'Deployment verified!'
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo 'PIPELINE COMPLETED SUCCESSFULLY!'
            echo '=========================================='
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Application: http://YOUR_EC2_IP:3001"
        }

        failure {
            echo '=========================================='
            echo 'PIPELINE FAILED!'
            echo '=========================================='
        }
    }
}
```

4. **IMPORTANT**: Replace:
   - `YOUR_DOCKERHUB_USERNAME` → Your Docker Hub username
   - `YOUR_GITHUB_USERNAME` → Your GitHub username
   - `YOUR_EC2_IP` → Your EC2 public IP

5. Click **"Save"**

**✅ Checkpoint**: Jenkinsfile configured!

---

## 🐳 Phase 8: Update docker-compose.yml for Volume Mounting

### Step 9: Create docker-compose.jenkins.yml

1. In your local project, create new file: `docker-compose.jenkins.yml`

2. Add this content:

```yaml
version: "3.8"

services:
  # Event Booking Application with Volume Mount
  eventbooking-jenkins-app:
    image: node:18-alpine
    container_name: eventbooking-jenkins-web
    working_dir: /app
    
    # VOLUME MOUNT: Attach code instead of using Dockerfile
    volumes:
      - ./:/app
      - /app/node_modules
    
    ports:
      - "3001:3000"  # Different port: 3001
    
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:eventbooking123@mongodb:27017/eventbooking?authSource=admin
      - ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - ADMIN_PIN=${ADMIN_PIN}
      - NEXT_PUBLIC_APP_URL=http://YOUR_EC2_IP:3001
    
    command: sh -c "npm install && npm run build && npm start"
    
    depends_on:
      - mongodb
    
    restart: unless-stopped
    
    networks:
      - eventbooking-jenkins-network

  # MongoDB with Volume for Persistence
  mongodb:
    image: mongo:7.0
    container_name: eventbooking-jenkins-db
    
    ports:
      - "27018:27017"  # Different port: 27018
    
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=eventbooking123
      - MONGO_INITDB_DATABASE=eventbooking
    
    volumes:
      - mongodb-jenkins-data:/data/db
      - mongodb-jenkins-config:/data/configdb
    
    restart: unless-stopped
    
    networks:
      - eventbooking-jenkins-network
    
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodb-jenkins-data:
    driver: local
  mongodb-jenkins-config:
    driver: local

networks:
  eventbooking-jenkins-network:
    driver: bridge
```

3. **Update with your EC2 IP**: Replace `YOUR_EC2_IP` with actual IP

4. **Key Changes from Part-I**:
   - ✅ Uses volume mount: `./:/app` instead of Dockerfile
   - ✅ Different ports: 3001 (app), 27018 (MongoDB)
   - ✅ Different container names: `eventbooking-jenkins-web`, `eventbooking-jenkins-db`
   - ✅ Different volume names: `mongodb-jenkins-data`
   - ✅ Uses `node:18-alpine` base image directly
   - ✅ Runs `npm install && npm build && npm start` on container startup

5. **Commit and push to GitHub**:
   ```bash
   git add docker-compose.jenkins.yml
   git commit -m "Add docker-compose for Jenkins with volume mounting"
   git push origin main
   ```

**✅ Checkpoint**: docker-compose.jenkins.yml created!

---

## 🚀 Phase 9: Run Pipeline

### Step 10: Execute Pipeline

1. Go to Jenkins → `EventBooking-Build-Pipeline`

2. Click **"Build Now"**

3. Watch build progress:
   - Click on build #1
   - Click "Console Output"
   - Monitor stages:
     - ✅ Checkout Code
     - ✅ Build and Run with Docker Compose
     - ✅ Verify Deployment

4. **Successful build** shows:
   ```
   ==========================================
   PIPELINE COMPLETED SUCCESSFULLY!
   ==========================================
   Build Number: 1
   Application: http://YOUR_EC2_IP:3001
   ```

### Step 11: Verify Deployment

1. **Check containers on EC2** (SSH):
   ```bash
   docker ps
   ```
   
   Should show:
   ```
   eventbooking-jenkins-web
   eventbooking-jenkins-db
   ```

2. **Check volumes**:
   ```bash
   docker volume ls
   ```
   
   Should show:
   ```
   mongodb-jenkins-data
   mongodb-jenkins-config
   ```

3. **Access application in browser**:
   ```
   http://YOUR_EC2_IP:3001
   ```
   
   Should see Event Booking app!

4. **Check logs**:
   ```bash
   docker logs eventbooking-jenkins-web
   docker logs eventbooking-jenkins-db
   ```

**✅ Checkpoint**: Pipeline working! Application deployed!

---

## 🔍 Troubleshooting

### Issue 1: Permission Denied - Docker

**Solution**:
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue 2: Port Already in Use

**Solution**:
```bash
docker-compose -f docker-compose.jenkins.yml down
docker ps -a
docker rm -f $(docker ps -aq)
```

### Issue 3: Jenkins Can't Find Workspace

**Solution**: Check workspace path in Jenkins:
```bash
ls -la /var/lib/jenkins/workspace/EventBooking-Build-Pipeline/
```

### Issue 4: npm install Fails

**Solution**: Ensure package.json is in repository and node_modules is in .dockerignore

---

## 📊 Assignment Deliverables

### What to Submit

1. **GitHub Repository**:
   - Link to repository
   - Screenshot showing:
     - `docker-compose.jenkins.yml`
     - Jenkinsfile (if stored in repo)
     - Latest commit

2. **Jenkins Screenshots**:
   - Jenkins dashboard
   - Installed plugins (Git, Pipeline, Docker Pipeline)
   - Pipeline configuration page
   - Successful build (Stage View)
   - Console Output showing all stages
   - Build history

3. **Docker Screenshots**:
   - `docker ps` showing containers with different names
   - `docker volume ls` showing volumes
   - `docker port eventbooking-jenkins-web`
   - `docker port eventbooking-jenkins-db`

4. **Application Screenshots**:
   - Browser showing app at port 3001
   - Application working (login, events, etc.)

5. **Volume Mount Evidence**:
   - Show docker inspect on container
   - Screenshot of volumes section showing `./:/app` mount

6. **Documentation**:
   - Explanation of volume mounting vs Dockerfile
   - Why different ports were used
   - Brief description of CI/CD flow

---

## 🎯 Key Differences from Part-I

| Aspect | Part-I | Part-II (Jenkins) |
|--------|--------|-------------------|
| **Code Deployment** | Dockerfile COPY | Volume mount `./:/app` |
| **App Port** | 3000 | 3001 |
| **MongoDB Port** | 27017 | 27018 |
| **Container Names** | eventbooking-web, eventbooking-db | eventbooking-jenkins-web, eventbooking-jenkins-db |
| **Volume Names** | mongodb-data | mongodb-jenkins-data |
| **Build Trigger** | Manual | Automated via Jenkins |
| **Build Location** | Local/EC2 manual | Jenkins workspace |

---

## ✨ Summary

You have successfully:

1. ✅ Pushed Event Booking code to GitHub
2. ✅ Installed Jenkins on AWS EC2 Linux
3. ✅ Configured Git, Pipeline, and Docker Pipeline plugins
4. ✅ Created automated pipeline with Jenkinsfile
5. ✅ Used volume mounting instead of Dockerfile
6. ✅ Deployed on different ports (3001, 27018)
7. ✅ Used different container names
8. ✅ Implemented automated CI/CD workflow

**Your pipeline now**:
- Automatically fetches code from GitHub
- Builds application in containerized environment using Docker
- Uses volume mounting for code deployment
- Runs on different ports to avoid conflicts
- All automated through Jenkins!

---

**Document Version:** 2.0  
**Last Updated:** November 4, 2025  
**Application:** Event Booking Platform  
**Purpose:** Jenkins CI/CD Assignment for Cloud Computing
