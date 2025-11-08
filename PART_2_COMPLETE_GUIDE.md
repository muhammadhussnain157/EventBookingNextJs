# Part-II: Jenkins CI/CD Pipeline - Complete Step-by-Step Guide

## 📋 Overview

This guide will help you set up Jenkins CI/CD pipeline on the **SAME EC2 instance** where Part-I is already running.

**What You'll Achieve:**
- ✅ Install Jenkins on your existing EC2
- ✅ Configure Jenkins with required plugins
- ✅ Create automated pipeline that fetches code from GitHub
- ✅ Build and deploy application using volume mounting
- ✅ Run Part-II containers on different ports (3001, 27018)

---

## 🎯 Prerequisites Checklist

Before starting, make sure you have:

- [x] Part-I running successfully on EC2 (port 3000)
- [x] EC2 instance public IP: `13.201.33.162` (replace with yours)
- [x] SSH access to EC2 instance
- [x] GitHub account
- [x] Docker Hub account
- [x] Your application code ready

---

## 📂 Part 1: Prepare Your Local Files

### Step 1.1: Create docker-compose.jenkins.yml

Create this file in your project root: `docker-compose.jenkins.yml`

```yaml
version: "3.8"

services:
  eventbooking-jenkins-app:
    image: node:18-alpine
    container_name: eventbooking-jenkins-web
    working_dir: /app
    
    # VOLUME MOUNT: Code attached as volume (NOT copied via Dockerfile)
    volumes:
      - ./:/app
      - /app/.next
    
    # Different port: 3001 (Part-I uses 3000)
    ports:
      - "3001:3000"
    
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:eventbooking123@mongodb:27017/eventbooking?authSource=admin
      - ACCESS_TOKEN_SECRET=your_access_token_secret_here
      - REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
      - CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
      - CLOUDINARY_API_KEY=your_cloudinary_api_key
      - CLOUDINARY_API_SECRET=your_cloudinary_api_secret
      - ADMIN_PIN=1004
      - NEXT_PUBLIC_APP_URL=http://13.201.33.162:3001
    
    command: sh -c "npm install && npm run build && npm start"
    
    depends_on:
      mongodb:
        condition: service_healthy
    
    restart: unless-stopped
    networks:
      - eventbooking-jenkins-network

  mongodb:
    image: mongo:7.0
    container_name: eventbooking-jenkins-db
    
    # Different port: 27018 (Part-I uses 27017)
    ports:
      - "27018:27017"
    
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
      start_period: 40s

volumes:
  mongodb-jenkins-data:
    driver: local
  mongodb-jenkins-config:
    driver: local

networks:
  eventbooking-jenkins-network:
    driver: bridge
```

**⚠️ Important:** Replace the environment variables with your actual values!

---

### Step 1.2: Create Jenkinsfile

Create this file in your project root: `Jenkinsfile` (no extension)

```groovy
pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        DOCKER_USERNAME = 'hassu157'
        GITHUB_REPO = 'https://github.com/muhammadhussnain157/EventBookingNextJs.git'
        WORKSPACE_DIR = "${WORKSPACE}"
        EC2_PUBLIC_IP = '13.201.33.162'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '=========================================='
                echo 'STAGE 1: Fetching code from GitHub'
                echo '=========================================='
                echo "Repository: ${GITHUB_REPO}"
                
                git branch: 'master',
                    url: "${GITHUB_REPO}"
                
                echo 'Code checkout completed successfully!'
                sh 'ls -la'
            }
        }

        stage('Verify Files') {
            steps {
                echo '=========================================='
                echo 'STAGE 2: Verifying required files'
                echo '=========================================='
                
                script {
                    sh """
                        if [ -f docker-compose.jenkins.yml ]; then
                            echo "✓ docker-compose.jenkins.yml found"
                        else
                            echo "✗ docker-compose.jenkins.yml not found!"
                            exit 1
                        fi
                        
                        if [ -f package.json ]; then
                            echo "✓ package.json found"
                        else
                            echo "✗ package.json not found!"
                            exit 1
                        fi
                    """
                }
                
                echo 'All required files verified!'
            }
        }

        stage('Stop Existing Containers') {
            steps {
                echo '=========================================='
                echo 'STAGE 3: Stopping existing containers'
                echo '=========================================='
                
                script {
                    sh """
                        cd ${WORKSPACE_DIR}
                        docker-compose -f docker-compose.jenkins.yml down || true
                        docker rm -f eventbooking-jenkins-web eventbooking-jenkins-db || true
                    """
                }
                
                echo 'Existing containers stopped!'
            }
        }

        stage('Build and Run with Docker Compose') {
            steps {
                echo '=========================================='
                echo 'STAGE 4: Building and starting containers'
                echo '=========================================='
                echo 'Using VOLUME MOUNTING instead of Dockerfile'
                
                script {
                    sh """
                        cd ${WORKSPACE_DIR}
                        docker-compose -f docker-compose.jenkins.yml up -d --build
                    """
                    
                    echo 'Waiting for containers to be ready...'
                    sleep 30
                }
                
                echo 'Containers started successfully!'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '=========================================='
                echo 'STAGE 5: Verifying containers are running'
                echo '=========================================='
                
                script {
                    sh """
                        echo "Checking containers:"
                        docker ps | grep eventbooking-jenkins
                        
                        echo ""
                        echo "Checking volumes:"
                        docker volume ls | grep eventbooking-jenkins
                    """
                    
                    def appRunning = sh(
                        script: 'docker ps | grep eventbooking-jenkins-web',
                        returnStatus: true
                    )
                    
                    if (appRunning == 0) {
                        echo '✓ Application container is running'
                    } else {
                        error '✗ Application container is not running!'
                    }
                    
                    def dbRunning = sh(
                        script: 'docker ps | grep eventbooking-jenkins-db',
                        returnStatus: true
                    )
                    
                    if (dbRunning == 0) {
                        echo '✓ Database container is running'
                    } else {
                        error '✗ Database container is not running!'
                    }
                }
                
                echo 'Deployment verified successfully!'
            }
        }

        stage('Display Container Logs') {
            steps {
                echo '=========================================='
                echo 'STAGE 6: Displaying container logs'
                echo '=========================================='
                
                script {
                    echo 'Application container logs:'
                    sh 'docker logs eventbooking-jenkins-web --tail 50 || true'
                    
                    echo ''
                    echo 'Database container logs:'
                    sh 'docker logs eventbooking-jenkins-db --tail 20 || true'
                }
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo 'PIPELINE COMPLETED SUCCESSFULLY!'
            echo '=========================================='
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Application URL: http://${EC2_PUBLIC_IP}:3001"
            echo "MongoDB Port: 27018"
            echo ''
            echo 'Container Details:'
            sh 'docker ps --filter name=eventbooking-jenkins'
            echo ''
            echo 'Volume Details:'
            sh 'docker volume ls --filter name=eventbooking-jenkins'
            echo '=========================================='
        }

        failure {
            echo '=========================================='
            echo 'PIPELINE FAILED!'
            echo '=========================================='
            echo 'Check the logs above for error details.'
            echo ''
            echo 'Container Status:'
            sh 'docker ps -a --filter name=eventbooking-jenkins || true'
            echo ''
            echo 'Recent Application Logs:'
            sh 'docker logs eventbooking-jenkins-web --tail 100 || true'
            echo '=========================================='
        }

        always {
            echo '=========================================='
            echo 'Pipeline execution completed.'
            echo "Timestamp: ${new Date()}"
            echo "Workspace: ${WORKSPACE_DIR}"
            echo '=========================================='
        }
    }
}
```

**⚠️ Important:** Update these values:
- `DOCKER_USERNAME`: Your Docker Hub username
- `GITHUB_REPO`: Your GitHub repository URL
- `EC2_PUBLIC_IP`: Your EC2 public IP
- Change `master` to `main` if your branch is named `main`

---

### Step 1.3: Push Files to GitHub

Open PowerShell in your project directory:

```powershell
# Navigate to your project
cd D:\Workspace\NextJs\EventBoooking

# Check git status
git status

# Add the new files
git add docker-compose.jenkins.yml Jenkinsfile

# Commit
git commit -m "Add Jenkins CI/CD configuration files"

# Push to GitHub
git push origin master
```

**✅ Checkpoint:** Files are now on GitHub!

---

## 🖥️ Part 2: Configure EC2 Instance

### Step 2.1: Update Security Group

1. **Go to AWS Console** → **EC2** → **Instances**

2. **Select your instance** (the one running Part-I)

3. Click **"Security"** tab → Click on the **security group link**

4. Click **"Edit inbound rules"**

5. **Add these new rules:**

   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | Custom TCP | 8080 | 0.0.0.0/0 | Jenkins Web UI |
   | Custom TCP | 3001 | 0.0.0.0/0 | Part-II Application |

6. Click **"Save rules"**

**Your security group should now have:**
```
Port 22   - SSH
Port 80   - HTTP (optional)
Port 3000 - Part-I Application
Port 3001 - Part-II Application (NEW)
Port 8080 - Jenkins UI (NEW)
Port 27017 - Part-I MongoDB
```

**✅ Checkpoint:** Security group updated!

---

### Step 2.2: Connect to EC2 via SSH

Open your terminal and connect:

```bash
ssh -i your-key.pem ubuntu@13.201.33.162
```

**Replace:**
- `your-key.pem` with your actual key file path
- `13.201.33.162` with your actual EC2 IP

**✅ Checkpoint:** Connected to EC2!

---

## 🛠️ Part 3: Install Jenkins on EC2

### Step 3.1: Update System

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

**⏱️ Wait:** This takes 2-3 minutes

---

### Step 3.2: Install Java (Jenkins Requirement)

**For Ubuntu 24.04 (Noble):**

```bash
sudo apt-get install -y openjdk-17-jdk
```

**For Ubuntu 22.04 or earlier:**

```bash
sudo apt-get install -y openjdk-11-jdk
```

**Verify installation:**

```bash
java -version
```

**Expected output:**
```
openjdk version "17.x.x" or "11.x.x"
```

**✅ Checkpoint:** Java installed!

---

### Step 3.3: Install Jenkins

**For Ubuntu 24.04 (Noble):**

```bash
# Add Jenkins GPG key (new method)
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

# Add Jenkins repository
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update package list
sudo apt-get update -y

# Install Jenkins
sudo apt-get install -y jenkins
```

**For Ubuntu 22.04 or earlier:**

```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Update package list
sudo apt-get update -y

# Install Jenkins
sudo apt-get install -y jenkins
```

**⏱️ Wait:** This takes 2-3 minutes

**✅ Checkpoint:** Jenkins installed!

---

### Step 3.4: Configure Jenkins User for Docker

```bash
# Add Jenkins user to docker group
sudo usermod -aG docker jenkins

# Verify docker group membership
groups jenkins
```

**Expected output should include:** `docker`

---

### Step 3.5: Start Jenkins Service

```bash
# Start Jenkins
sudo systemctl start jenkins

# Enable Jenkins to start on boot
sudo systemctl enable jenkins

# Check Jenkins status
sudo systemctl status jenkins
```

**Expected output:**
```
● jenkins.service - Jenkins Continuous Integration Server
     Loaded: loaded
     Active: active (running)
```

**Press `q` to exit**

---

### Step 3.6: Restart Jenkins (Apply Docker Group)

```bash
sudo systemctl restart jenkins
```

**⏱️ Wait:** 30 seconds for Jenkins to restart

**✅ Checkpoint:** Jenkins is running!

---

## 🌐 Part 4: Access and Configure Jenkins

### Step 4.1: Get Initial Admin Password

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**Copy the password** (long string like: `7fa68bb7052d47f599a876f32e149229`)

---

### Step 4.2: Open Jenkins in Browser

Open your web browser and go to:

```
http://13.201.33.162:8080
```

**Replace `13.201.33.162` with your actual EC2 IP!**

**⏱️ Wait:** 1-2 minutes if page doesn't load immediately (Jenkins is starting)

---

### Step 4.3: Unlock Jenkins

1. **Paste the password** you copied
2. Click **"Continue"**

**✅ Checkpoint:** Jenkins unlocked!

---

### Step 4.4: Install Plugins

1. Select **"Install suggested plugins"**
2. **Wait** for installation (3-5 minutes)
3. You'll see progress bars for each plugin

**✅ Checkpoint:** Plugins installed!

---

### Step 4.5: Create Admin User

Fill in the form:
- **Username:** `admin`
- **Password:** (create a strong password - **SAVE IT!**)
- **Full name:** Your name
- **Email:** Your email

Click **"Save and Continue"**

---

### Step 4.6: Instance Configuration

- **Jenkins URL** will show: `http://13.201.33.162:8080/`
- **Keep it as is**
- Click **"Save and Finish"**

---

### Step 4.7: Start Using Jenkins

Click **"Start using Jenkins"**

**✅ Checkpoint:** Jenkins is ready!

---

## 🔌 Part 5: Install Required Plugins

### Step 5.1: Go to Plugin Manager

1. Click **"Manage Jenkins"** (left sidebar)
2. Click **"Plugins"**

---

### Step 5.2: Install Required Plugins

1. Click **"Available plugins"** tab
2. **Search and select** these plugins:
   - ✅ Git plugin
   - ✅ GitHub plugin
   - ✅ Pipeline
   - ✅ Pipeline: Stage View
   - ✅ Docker Pipeline
   - ✅ Docker plugin

3. Click **"Install"** button

4. **Optional:** Check "Restart Jenkins when installation is complete"

5. **Wait** 2-3 minutes for installation

6. If Jenkins restarts, **log in again** with your admin credentials

**✅ Checkpoint:** All plugins installed!

---

## 🔐 Part 6: Configure Docker Hub Credentials

### Step 6.1: Go to Credentials

1. Click **"Manage Jenkins"**
2. Click **"Credentials"**
3. Click **(global)** under "Stores scoped to Jenkins"
4. Click **"Add Credentials"**

---

### Step 6.2: Add Docker Hub Credentials

Fill in the form:
- **Kind:** `Username with password`
- **Scope:** `Global`
- **Username:** Your Docker Hub username (e.g., `hassu157`)
- **Password:** Your Docker Hub password
- **ID:** `dockerhub-credentials` ⚠️ **MUST be exact!**
- **Description:** `Docker Hub login credentials`

Click **"Create"**

**✅ Checkpoint:** Docker Hub credentials added!

---

### Step 6.3: Verify Jenkins Can Use Docker

**Back in EC2 SSH terminal:**

```bash
sudo -u jenkins docker ps
```

**Expected:** Should show your Part-I containers

**If permission denied:**

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
# Wait 30 seconds, then try again
```

**✅ Checkpoint:** Jenkins can use Docker!

---

## 📋 Part 7: Create Jenkins Pipeline

### Step 7.1: Create New Pipeline

1. From Jenkins Dashboard, click **"New Item"**
2. **Enter name:** `EventBooking-Build-Pipeline`
3. **Select:** "Pipeline"
4. Click **"OK"**

---

### Step 7.2: Configure General Settings

**Description:**
```
Automated CI/CD pipeline for Event Booking app with volume mounting (Part-II)
```

---

### Step 7.3: Configure Build Triggers

**Build Triggers section:**

1. ✅ Check **"Poll SCM"**
2. **Schedule:** `H/5 * * * *`
3. This means: Jenkins checks GitHub every 5 minutes for changes

---

### Step 7.4: Configure Pipeline

**Pipeline section:**

1. **Definition:** Select `Pipeline script from SCM`
2. **SCM:** Select `Git`
3. **Repository URL:** `https://github.com/muhammadhussnain157/EventBookingNextJs.git`
4. **Credentials:** `- none -` (for public repo)
5. **Branch Specifier:** `*/master` (or `*/main` if your branch is main)
6. **Script Path:** `Jenkinsfile`

---

### Step 7.5: Save Configuration

Click **"Save"**

**✅ Checkpoint:** Pipeline created!

---

## 🚀 Part 8: Run Your First Build

### Step 8.1: Trigger Build

1. Click on **`EventBooking-Build-Pipeline`**
2. Click **"Build Now"** (left sidebar)

---

### Step 8.2: Monitor Build

1. **Build #1** appears in "Build History"
2. Click on **#1**
3. Click **"Console Output"** to see live logs

**⏱️ Wait:** 3-5 minutes for first build (npm install + build)

---

### Step 8.3: Verify Success

**Successful build shows:**

```
==========================================
PIPELINE COMPLETED SUCCESSFULLY!
==========================================
Build Number: 1
Application URL: http://13.201.33.162:3001
MongoDB Port: 27018
==========================================
Finished: SUCCESS
```

**✅ Checkpoint:** Pipeline successful!

---

## ✅ Part 9: Verification

### Step 9.1: Check Containers on EC2

**In EC2 SSH terminal:**

```bash
docker ps
```

**Expected output - 4 containers:**

```
CONTAINER ID   IMAGE              NAMES
xxxxx          node:18-alpine     eventbooking-jenkins-web  (port 3001)
xxxxx          mongo:7.0          eventbooking-jenkins-db   (port 27018)
xxxxx          your-image         eventbooking-web          (port 3000)
xxxxx          mongo:7.0          eventbooking-db           (port 27017)
```

---

### Step 9.2: Check Volumes

```bash
docker volume ls
```

**Expected output:**

```
mongodb-data                (Part-I)
mongodb-config             (Part-I)
mongodb-jenkins-data       (Part-II)
mongodb-jenkins-config     (Part-II)
```

---

### Step 9.3: Check Networks

```bash
docker network ls
```

**Expected output includes:**

```
eventbooking-network         (Part-I)
eventbooking-jenkins-network (Part-II)
```

---

### Step 9.4: Test Applications

**Part-I Application:**
```
http://13.201.33.162:3000
```

**Part-II Application:**
```
http://13.201.33.162:3001
```

Both should work! ✅

---

### Step 9.5: Verify Volume Mounting

```bash
docker inspect eventbooking-jenkins-web | grep -A 10 Mounts
```

**Should show:** Volume mount from Jenkins workspace to `/app`

**✅ Checkpoint:** Everything verified!

---

## 🔄 Part 10: Test Automated Builds

### Step 10.1: Make a Code Change

**On your local machine:**

```powershell
cd D:\Workspace\NextJs\EventBoooking

# Make a small change
echo "# Jenkins CI/CD Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test Jenkins auto-build trigger"
git push origin master
```

---

### Step 10.2: Wait for Auto-Build

**⏱️ Wait:** Up to 5 minutes (SCM polling interval)

Jenkins will automatically:
1. Detect the change
2. Start build #2
3. Deploy the new code

**✅ Checkpoint:** Automated builds working!

---

## 📊 Part 11: What You've Achieved

### ✅ Part-II Completed!

You now have:

1. ✅ Jenkins installed on EC2
2. ✅ Automated CI/CD pipeline
3. ✅ Code fetched from GitHub
4. ✅ Application built in containerized environment
5. ✅ Volume mounting (NO Dockerfile for code)
6. ✅ Different ports (3001, 27018)
7. ✅ Different container names
8. ✅ Both Part-I and Part-II running on same EC2

---

### 🎯 Key Differences: Part-I vs Part-II

| Aspect | Part-I | Part-II |
|--------|--------|---------|
| **Code Deployment** | Dockerfile COPY | Volume mount `./:/app` |
| **App Port** | 3000 | 3001 |
| **MongoDB Port** | 27017 | 27018 |
| **Container Names** | eventbooking-web, eventbooking-db | eventbooking-jenkins-web, eventbooking-jenkins-db |
| **Volume Names** | mongodb-data | mongodb-jenkins-data |
| **Build Trigger** | Manual | Automated via Jenkins |
| **Build Location** | Local/EC2 manual | Jenkins workspace |

---

## 🔧 Troubleshooting

### Issue 1: Jenkins Can't Access Docker

**Solution:**
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

---

### Issue 2: Port Already in Use

**Check what's using the port:**
```bash
sudo lsof -i :3001
sudo lsof -i :8080
```

**Stop Part-II containers:**
```bash
cd /var/lib/jenkins/workspace/EventBooking-Build-Pipeline
docker-compose -f docker-compose.jenkins.yml down
```

---

### Issue 3: Build Fails - npm install Error

**Check container logs:**
```bash
docker logs eventbooking-jenkins-web --tail 200
```

**Common fix:** Ensure `package.json` is in GitHub repository

---

### Issue 4: Container Keeps Restarting

**Check logs:**
```bash
docker logs eventbooking-jenkins-web --tail 200
```

**Common causes:**
- Missing dependencies in `package.json`
- Environment variables incorrect
- Build failing

---

### Issue 5: Can't Access Application at Port 3001

**Check:**
1. Security group has port 3001 open
2. Container is running: `docker ps | grep jenkins`
3. Application is listening: `docker logs eventbooking-jenkins-web`

---

## 📝 Quick Reference Commands

### Jenkins Commands

```bash
# Check Jenkins status
sudo systemctl status jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f
```

---

### Docker Commands

```bash
# List all containers
docker ps -a

# List Part-II containers only
docker ps | grep jenkins

# View container logs
docker logs eventbooking-jenkins-web --tail 100
docker logs eventbooking-jenkins-db --tail 50

# Stop Part-II containers
docker-compose -f docker-compose.jenkins.yml down

# Start Part-II containers
docker-compose -f docker-compose.jenkins.yml up -d

# Remove all stopped containers
docker container prune
```

---

### Git Commands

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin master

# Pull from GitHub
git pull origin master
```

---

## 🎉 Congratulations!

You have successfully completed Part-II of the assignment!

Your EC2 instance now runs:

```
EC2 Instance: 13.201.33.162
├── Jenkins Server (Port 8080)
│   └── Manages automated builds
│
├── Part-I: Manual Docker Deployment
│   ├── eventbooking-web (Port 3000)
│   ├── eventbooking-db (Port 27017)
│   └── Volumes: mongodb-data, mongodb-config
│
└── Part-II: Jenkins Automated Deployment
    ├── eventbooking-jenkins-web (Port 3001)
    ├── eventbooking-jenkins-db (Port 27018)
    └── Volumes: mongodb-jenkins-data, mongodb-jenkins-config
```

---

## 📧 Need Help?

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. Review **Console Output** in Jenkins
3. Check **container logs** using Docker commands
4. Verify **security group** settings in AWS
5. Ensure all **environment variables** are correct

---

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Application:** Event Booking Platform  
**Purpose:** Jenkins CI/CD Assignment - Complete Implementation Guide
