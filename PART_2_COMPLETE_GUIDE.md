# Complete Cloud Deployment Guide: Part-I & Part-II

## 📋 Overview

This comprehensive guide covers:
- **Part-I:** Containerized deployment using Dockerfile and Docker Compose
- **Part-II:** Jenkins CI/CD automation pipeline with volume mounting

Both parts will run on the same AWS EC2 instance with different ports.

---

# 🚀 PART-I: Containerized Deployment with Dockerfile

## What You'll Deploy:
- Web Application (Next.js) on **port 3000**
- MongoDB Database on **port 27017**
- Using Dockerfile to build application image
- Persistent volume for database

---

## Part-I Step 1: Prepare Local Files

### 1.1 Create Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### 1.2 Create docker-compose.yml

Create `docker-compose.yml` in your project root:

```yaml
version: "3.8"

services:
  eventbooking-app:
    container_name: eventbooking-web
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:eventbooking123@mongodb:27017/eventbooking?authSource=admin
      - ACCESS_TOKEN_SECRET=your-access-token-secret-here-make-it-long-and-random-123
      - REFRESH_TOKEN_SECRET=your-refresh-token-secret-here-make-it-long-and-random-456
      - CLOUDINARY_CLOUD_NAME=dgos35yqc
      - CLOUDINARY_API_KEY=181494556746859
      - CLOUDINARY_API_SECRET=UBc3uCdTr1lNSJhofRVDtAj7ZZg
      - ADMIN_PIN=1004
      - NEXT_PUBLIC_APP_URL=http://YOUR_EC2_IP:3000
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - eventbooking-network

  mongodb:
    image: mongo:7.0
    container_name: eventbooking-db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=eventbooking123
      - MONGO_INITDB_DATABASE=eventbooking
    volumes:
      - mongodb-data:/data/db
      - mongodb-config:/data/configdb
    restart: unless-stopped
    networks:
      - eventbooking-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodb-data:
    driver: local
  mongodb-config:
    driver: local

networks:
  eventbooking-network:
    driver: bridge
```

### 1.3 Create .dockerignore

Create `.dockerignore` file:

```
node_modules
.next
.git
.env
.env.local
README.md
.vscode
```

---

## Part-I Step 2: Setup AWS EC2 Instance

### 2.1 Launch EC2 Instance

1. **Login to AWS Console** → Navigate to EC2
2. **Click "Launch Instance"**
3. **Configure Instance:**
   - Name: `EventBooking-Server`
   - AMI: **Ubuntu Server 22.04 LTS**
   - Instance Type: **t2.medium** (minimum for Docker + Jenkins)
   - Key Pair: Create new or select existing
   - Storage: **20 GB** minimum

### 2.2 Configure Security Group

Add these **Inbound Rules**:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH Access |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Part-I App |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 | Part-II App |
| Custom TCP | TCP | 8080 | My IP | Jenkins |

### 2.3 Launch and Note Public IP

- Click **Launch Instance**
- Note your **Public IPv4 Address** (e.g., `43.205.229.191`)

---

## Part-I Step 3: Connect to EC2 and Install Docker

### 3.1 SSH into EC2

```bash
# Windows (PowerShell)
ssh -i "your-key.pem" ubuntu@43.205.229.191

# Mac/Linux
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@43.205.229.191
```

### 3.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
```

### 3.4 Install Docker Compose

```bash
# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker-compose --version
```

---

## Part-I Step 4: Deploy Application

### 4.1 Transfer Files to EC2

**Option A: Using Git (Recommended)**

```bash
# On EC2
cd ~
git clone https://github.com/YOUR_USERNAME/EventBookingNextJs.git
cd EventBookingNextJs
```

**Option B: Using SCP (from local machine)**

```bash
# From your local machine
scp -i "your-key.pem" -r ./EventBookingNextJs ubuntu@43.205.229.191:~
```

### 4.2 Update EC2 IP in docker-compose.yml

```bash
# Edit docker-compose.yml on EC2
nano docker-compose.yml

# Update this line with your EC2 IP:
- NEXT_PUBLIC_APP_URL=http://43.205.229.191:3000
```

### 4.3 Build and Run Containers

```bash
# Build the Docker image
docker-compose build

# Start containers in detached mode
docker-compose up -d

# Check container status
docker-compose ps
```

### 4.4 Verify Deployment

```bash
# Check container logs
docker-compose logs -f eventbooking-web

# Check if containers are running
docker ps

# Test MongoDB connection
docker exec -it eventbooking-db mongosh -u admin -p eventbooking123 --authenticationDatabase admin
```

### 4.5 Access Application

Open browser and visit:
- **Application:** `http://43.205.229.191:3000`

---

## Part-I Step 5: Push to Docker Hub (Optional)

### 5.1 Build and Tag Image

```bash
# Login to Docker Hub
docker login

# Build image
docker build -t YOUR_DOCKERHUB_USERNAME/eventbooking-app:latest .

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/eventbooking-app:latest
```

---

## Part-I Verification Checklist

- [ ] EC2 instance running
- [ ] Docker and Docker Compose installed
- [ ] Application accessible on port 3000
- [ ] MongoDB container running with persistent volume
- [ ] Data persists after container restart: `docker-compose restart`

---

# 🔄 PART-II: Jenkins CI/CD Automation Pipeline

## What You'll Deploy:
- Same application using **Jenkins automation**
- Using **volume mounting** (NOT Dockerfile)
- Different ports: **3001** (app), **27018** (MongoDB)
- Different container names: **eventbooking-jenkins-web**, **eventbooking-jenkins-db**

---

## Part-II Step 1: Prepare Local Files

### 1.1 Create docker-compose.jenkins.yml

Create `docker-compose.jenkins.yml` in your project root:

```yaml
version: "3.8"

services:
  eventbooking-jenkins-app:
    image: node:18-alpine
    container_name: eventbooking-jenkins-web
    working_dir: /app
    
    # VOLUME MOUNT: Code attached as volume (NOT Dockerfile)
    volumes:
      - ./:/app
      - /app/node_modules
      - /app/.next
    
    # Different port: 3001 (Part-I uses 3000)
    ports:
      - "3001:3000"
    
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:eventbooking123@eventbooking-jenkins-db:27017/eventbooking?authSource=admin
      - ACCESS_TOKEN_SECRET=your-access-token-secret-here-make-it-long-and-random-123
      - REFRESH_TOKEN_SECRET=your-refresh-token-secret-here-make-it-long-and-random-456
      - CLOUDINARY_CLOUD_NAME=dgos35yqc
      - CLOUDINARY_API_KEY=181494556746859
      - CLOUDINARY_API_SECRET=UBc3uCdTr1lNSJhofRVDtAj7ZZg
      - ADMIN_PIN=1004
      - NEXT_PUBLIC_APP_URL=http://43.205.229.191:3001
    
    command: sh -c "npm install && npm run build && npm start"
    
    depends_on:
      - eventbooking-jenkins-db
    
    restart: unless-stopped
    networks:
      - eventbooking-jenkins-network

  eventbooking-jenkins-db:
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

volumes:
  mongodb-jenkins-data:
    driver: local
  mongodb-jenkins-config:
    driver: local

networks:
  eventbooking-jenkins-network:
    driver: bridge
```

### 1.2 Create Jenkinsfile

Create `Jenkinsfile` in your project root:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        EC2_PUBLIC_IP = '43.205.229.191'
        COMPOSE_FILE = 'docker-compose.jenkins.yml'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '========== Checking out code from GitHub =========='
                checkout scm
            }
        }

        stage('Verify Files') {
            steps {
                echo '========== Verifying required files =========='
                sh '''
                    echo "Listing workspace files:"
                    ls -la
                    
                    if [ ! -f "${COMPOSE_FILE}" ]; then
                        echo "ERROR: ${COMPOSE_FILE} not found!"
                        exit 1
                    fi
                    
                    echo "Docker Compose file found!"
                    cat ${COMPOSE_FILE}
                '''
            }
        }

        stage('Stop Existing Containers') {
            steps {
                echo '========== Stopping existing containers =========='
                sh '''
                    if [ -f "${COMPOSE_FILE}" ]; then
                        docker-compose -f ${COMPOSE_FILE} down || true
                        docker system prune -f
                    fi
                '''
            }
        }

        stage('Build and Run') {
            steps {
                echo '========== Building and running containers =========='
                sh '''
                    docker-compose -f ${COMPOSE_FILE} up -d --build
                    
                    echo "Waiting 120 seconds for containers to be ready..."
                    sleep 120
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '========== Verifying deployment =========='
                sh '''
                    echo "Checking running containers:"
                    docker ps
                    
                    echo "\\nChecking container health:"
                    docker-compose -f ${COMPOSE_FILE} ps
                    
                    echo "\\nApplication should be accessible at: http://${EC2_PUBLIC_IP}:3001"
                '''
            }
        }

        stage('Display Container Logs') {
            steps {
                echo '========== Container Logs =========='
                sh '''
                    echo "=== Web Container Logs ==="
                    docker logs eventbooking-jenkins-web --tail 50
                    
                    echo "\\n=== Database Container Logs ==="
                    docker logs eventbooking-jenkins-db --tail 20
                '''
            }
        }
    }

    post {
        success {
            echo '========== DEPLOYMENT SUCCESSFUL =========='
            echo "Application URL: http://${EC2_PUBLIC_IP}:3001"
        }
        failure {
            echo '========== DEPLOYMENT FAILED =========='
            sh 'docker-compose -f ${COMPOSE_FILE} logs'
        }
    }
}
```

### 1.3 Push to GitHub

```bash
# Add files
git add docker-compose.jenkins.yml Jenkinsfile

# Commit
git commit -m "Add Jenkins deployment files with volume mounting"

# Push to GitHub
git push origin master
```

---

## Part-II Step 2: Install Jenkins on EC2

### 2.1 SSH into EC2

```bash
ssh -i "your-key.pem" ubuntu@43.205.229.191
```

### 2.2 Install Java (Jenkins Requirement)

```bash
# Install Java 17
sudo apt update
sudo apt install -y fontconfig openjdk-17-jre

# Verify Java installation
java -version
```

### 2.3 Install Jenkins

```bash
# Add Jenkins repository key
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

# Add Jenkins repository
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update package list
sudo apt update

# Install Jenkins
sudo apt install -y jenkins

# Start Jenkins service
sudo systemctl start jenkins

# Enable Jenkins to start on boot
sudo systemctl enable jenkins

# Check Jenkins status
sudo systemctl status jenkins
```

### 2.4 Get Initial Admin Password

```bash
# Get the initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**Copy this password** - you'll need it in the next step!

### 2.5 Add Jenkins User to Docker Group

```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Verify
groups jenkins
```

---

## Part-II Step 3: Configure Jenkins Web Interface

### 3.1 Access Jenkins

1. Open browser: `http://43.205.229.191:8080`
2. Paste the initial admin password
3. Click **Continue**

### 3.2 Install Plugins

1. Select **"Install suggested plugins"**
2. Wait for installation to complete

### 3.3 Create Admin User

1. Fill in the form:
   - Username: `admin`
   - Password: (your choice)
   - Full name: `Admin`
   - Email: your email
2. Click **Save and Continue**

### 3.4 Jenkins URL

1. Keep default URL: `http://43.205.229.191:8080/`
2. Click **Save and Finish**
3. Click **Start using Jenkins**

---

## Part-II Step 4: Install Required Jenkins Plugins

### 4.1 Navigate to Plugin Manager

1. Click **Manage Jenkins** (left sidebar)
2. Click **Plugins**
3. Click **Available plugins** tab

### 4.2 Install Plugins

Search and install these plugins:

1. **Git** (usually pre-installed)
2. **Pipeline** (usually pre-installed)
3. **Docker Pipeline**
4. **GitHub Integration**

**Installation Steps:**
- Check the box next to each plugin
- Click **Install**
- Wait for installation
- Check **"Restart Jenkins when installation is complete"**

### 4.3 Wait for Restart

Jenkins will restart automatically. Refresh the page after 1-2 minutes.

---

## Part-II Step 5: Configure Docker Hub Credentials

### 5.1 Navigate to Credentials

1. Click **Manage Jenkins**
2. Click **Credentials**
3. Click **System**
4. Click **Global credentials (unrestricted)**
5. Click **Add Credentials**

### 5.2 Add Docker Hub Credentials

Fill in:
- **Kind:** Username with password
- **Scope:** Global
- **Username:** `hassu157` (your Docker Hub username)
- **Password:** (your Docker Hub password)
- **ID:** `dockerhub-credentials`
- **Description:** Docker Hub Credentials

Click **Create**

---

## Part-II Step 6: Create Jenkins Pipeline

### 6.1 Create New Pipeline

1. From Jenkins dashboard, click **New Item**
2. Enter name: `EventBooking-Build-Pipeline`
3. Select **Pipeline**
4. Click **OK**

### 6.2 Configure Pipeline

#### General Section:
- **Description:** `Automated CI/CD pipeline for Event Booking application`
- Check **GitHub project**
- **Project url:** `https://github.com/muhammadhussnain157/EventBookingNextJs/`

#### Build Triggers:
- Check **Poll SCM**
- **Schedule:** `H/5 * * * *` (checks GitHub every 5 minutes)

#### Pipeline Section:
- **Definition:** Pipeline script from SCM
- **SCM:** Git
- **Repository URL:** `https://github.com/muhammadhussnain157/EventBookingNextJs.git`
- **Credentials:** None (for public repo)
- **Branch:** `*/master`
- **Script Path:** `Jenkinsfile`

### 6.3 Save Pipeline

Click **Save**

---

## Part-II Step 7: Run First Build

### 7.1 Trigger Build

1. Click **Build Now** (left sidebar)
2. Watch build progress in **Build History**
3. Click on build number (e.g., `#1`)
4. Click **Console Output**

### 7.2 Monitor Build

Watch the console output for:
- ✅ Checkout Code
- ✅ Verify Files
- ✅ Stop Existing Containers
- ✅ Build and Run
- ✅ Verify Deployment
- ✅ Display Container Logs

### 7.3 Wait for Completion

Build takes approximately **2-3 minutes**. Look for:
```
========== DEPLOYMENT SUCCESSFUL ==========
Application URL: http://43.205.229.191:3001
Finished: SUCCESS
```

---

## Part-II Step 8: Verify Deployment

### 8.1 Check Containers on EC2

```bash
# SSH into EC2
ssh -i "your-key.pem" ubuntu@43.205.229.191

# Check running containers
docker ps

# You should see:
# - eventbooking-jenkins-web (port 3001)
# - eventbooking-jenkins-db (port 27018)
```

### 8.2 Check Container Logs

```bash
# Web container logs
docker logs eventbooking-jenkins-web

# Database logs
docker logs eventbooking-jenkins-db
```

### 8.3 Access Application

Open browser:
- **Part-II Application:** `http://43.205.229.191:3001`
- **Part-I Application:** `http://43.205.229.191:3000` (should still be running)

---

## Part-II Step 9: Test Automation

### 9.1 Make Code Change

1. Edit any file in your local repository
2. Commit and push:

```bash
git add .
git commit -m "Test Jenkins automation"
git push origin master
```

### 9.2 Watch Jenkins

1. Within 5 minutes, Jenkins will detect the change
2. New build will start automatically
3. Application will be redeployed

---

## Part-II Verification Checklist

- [ ] Jenkins installed and running on port 8080
- [ ] Git, Pipeline, and Docker Pipeline plugins installed
- [ ] Docker Hub credentials configured
- [ ] Pipeline created and configured
- [ ] First build successful
- [ ] Application accessible on port 3001
- [ ] MongoDB running on port 27018
- [ ] Volume mounting working (code changes reflected)
- [ ] Automatic builds triggered on git push
- [ ] Both Part-I (3000) and Part-II (3001) running simultaneously

---

## 🎯 Quick Command Reference

### Part-I Commands
```bash
# Start Part-I containers
cd ~/EventBookingNextJs
docker-compose up -d

# Stop Part-I containers
docker-compose down

# View Part-I logs
docker-compose logs -f
```

### Part-II Commands
```bash
# Start Part-II containers (via Jenkins)
# Use Jenkins UI to trigger build

# Manual start (if needed)
cd /var/lib/jenkins/workspace/EventBooking-Build-Pipeline
docker-compose -f docker-compose.jenkins.yml up -d

# Stop Part-II containers
docker-compose -f docker-compose.jenkins.yml down

# View Part-II logs
docker logs eventbooking-jenkins-web
docker logs eventbooking-jenkins-db
```

### Check All Containers
```bash
# List all running containers
docker ps

# Check disk usage
df -h

# Check Docker volumes
docker volume ls
```

---

## 🔧 Troubleshooting

### Issue 1: Jenkins Build Fails - "Cannot connect to Docker daemon"

**Solution:**
```bash
# Add jenkins to docker group
sudo usermod -aG docker jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Verify
groups jenkins
```

### Issue 2: Port Already in Use

**Solution:**
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill the process if needed
sudo kill -9 <PID>

# Or use different port in docker-compose.jenkins.yml
```

### Issue 3: Containers Exit Immediately

**Solution:**
```bash
# Check container logs
docker logs eventbooking-jenkins-web

# Common issues:
# - Missing dependencies: Check npm install output
# - MongoDB connection: Verify MongoDB is running
# - Environment variables: Check .env values
```

### Issue 4: Cannot Access Application

**Check:**
1. Security group allows port 3001
2. Containers are running: `docker ps`
3. EC2 IP is correct in NEXT_PUBLIC_APP_URL
4. Firewall: `sudo ufw status`

---

## 📊 Assignment Requirements Checklist

### Part-I Requirements
- [x] Web application with database
- [x] Dockerfile to build image
- [x] Docker Compose file
- [x] Deployed on AWS EC2
- [x] Persistent volume for database
- [x] Image pushed to Docker Hub

### Part-II Requirements
- [x] Code in GitHub repository
- [x] Jenkins running on EC2
- [x] Pipeline script using Git, Pipeline, Docker Pipeline plugins
- [x] Automated build from GitHub
- [x] Volume mounting (NOT Dockerfile)
- [x] Different port numbers (3001 vs 3000)
- [x] Different container names (eventbooking-jenkins-* vs eventbooking-*)
- [x] Containerized deployment via Jenkins

---

## 🎓 What You've Learned

### Part-I Skills
✅ Writing Dockerfile for Node.js applications  
✅ Creating Docker Compose configurations  
✅ Setting up AWS EC2 instances  
✅ Configuring security groups  
✅ Installing Docker and Docker Compose  
✅ Managing persistent volumes  
✅ Pushing images to Docker Hub  

### Part-II Skills
✅ Installing and configuring Jenkins  
✅ Creating Jenkins pipelines  
✅ Integrating Jenkins with GitHub  
✅ Using volume mounting for code deployment  
✅ Running multiple containerized apps on same host  
✅ Automating CI/CD workflows  
✅ Managing different environments (Part-I vs Part-II)  

---

## 📞 Need Help?

**Common Issues:**
- Jenkins not starting → Check Java installation
- Build fails → Check Jenkins logs: `sudo journalctl -u jenkins -f`
- Docker permission denied → Add user to docker group
- Port conflicts → Use different ports or stop conflicting services

**Useful Commands:**
```bash
# Restart Jenkins
sudo systemctl restart jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f

# Clear Docker cache
docker system prune -a

# Check Jenkins workspace
ls /var/lib/jenkins/workspace/EventBooking-Build-Pipeline
```

---

## 🎉 Success!

You've successfully completed both parts:
- **Part-I:** Application running at `http://43.205.229.191:3000`
- **Part-II:** Application running at `http://43.205.229.191:3001`
- **Jenkins:** Accessible at `http://43.205.229.191:8080`

Both applications are running simultaneously on the same EC2 instance!

---

**Last Updated:** November 8, 2025  
**EC2 IP:** 43.205.229.191  
**Repository:** https://github.com/muhammadhussnain157/EventBookingNextJs
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
