// ============================================
// JENKINSFILE FOR EVENT BOOKING APPLICATION
// CI/CD Pipeline with Volume Mounting
// ============================================

pipeline {
    agent any

    environment {
        // Docker Hub credentials (configured in Jenkins)
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        
        // Docker Hub username
        DOCKER_USERNAME = 'hassu157'
        
        // GitHub repository URL
        GITHUB_REPO = 'https://github.com/muhammadhussnain157/EventBookingNextJs.git'
        
        // Workspace directory
        WORKSPACE_DIR = "${WORKSPACE}"
        
        // EC2 Public IP (update with your actual IP)
        EC2_PUBLIC_IP = '13.201.33.162'
    }

    stages {
        // ========================================
        // STAGE 1: CHECKOUT CODE FROM GITHUB
        // ========================================
        stage('Checkout Code') {
            steps {
                echo '=========================================='
                echo 'STAGE 1: Fetching code from GitHub'
                echo '=========================================='
                echo "Repository: ${GITHUB_REPO}"
                
                // Checkout code from GitHub main branch
                git branch: 'main',
                    url: "${GITHUB_REPO}"
                
                echo 'Code checkout completed successfully!'
                
                // List files to verify
                sh 'ls -la'
            }
        }

        // ========================================
        // STAGE 2: VERIFY REQUIRED FILES
        // ========================================
        stage('Verify Files') {
            steps {
                echo '=========================================='
                echo 'STAGE 2: Verifying required files'
                echo '=========================================='
                
                script {
                    // Check if docker-compose.jenkins.yml exists
                    sh """
                        if [ -f docker-compose.jenkins.yml ]; then
                            echo "✓ docker-compose.jenkins.yml found"
                        else
                            echo "✗ docker-compose.jenkins.yml not found!"
                            exit 1
                        fi
                    """
                    
                    // Check if package.json exists
                    sh """
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

        // ========================================
        // STAGE 3: STOP EXISTING CONTAINERS
        // ========================================
        stage('Stop Existing Containers') {
            steps {
                echo '=========================================='
                echo 'STAGE 3: Stopping existing containers'
                echo '=========================================='
                
                script {
                    // Stop and remove existing containers
                    sh """
                        cd ${WORKSPACE_DIR}
                        docker-compose -f docker-compose.jenkins.yml down || true
                        docker rm -f eventbooking-jenkins-web eventbooking-jenkins-db || true
                    """
                }
                
                echo 'Existing containers stopped!'
            }
        }

        // ========================================
        // STAGE 4: BUILD AND START CONTAINERS
        // ========================================
        stage('Build and Run with Docker Compose') {
            steps {
                echo '=========================================='
                echo 'STAGE 4: Building and starting containers'
                echo '=========================================='
                echo 'Using VOLUME MOUNTING instead of Dockerfile'
                
                script {
                    // Start containers using docker-compose
                    sh """
                        cd ${WORKSPACE_DIR}
                        docker-compose -f docker-compose.jenkins.yml up -d --build
                    """
                    
                    // Wait for containers to be healthy
                    echo 'Waiting for containers to be ready...'
                    sleep 30
                }
                
                echo 'Containers started successfully!'
            }
        }

        // ========================================
        // STAGE 5: VERIFY DEPLOYMENT
        // ========================================
        stage('Verify Deployment') {
            steps {
                echo '=========================================='
                echo 'STAGE 5: Verifying containers are running'
                echo '=========================================='
                
                script {
                    // Check running containers
                    sh """
                        echo "Checking containers:"
                        docker ps | grep eventbooking-jenkins || echo "Warning: Containers not found"
                        
                        echo ""
                        echo "Checking volumes:"
                        docker volume ls | grep eventbooking-jenkins || echo "Warning: Volumes not found"
                        
                        echo ""
                        echo "Checking network:"
                        docker network ls | grep eventbooking-jenkins || echo "Warning: Network not found"
                    """
                    
                    // Check if app container is running
                    def appRunning = sh(
                        script: 'docker ps | grep eventbooking-jenkins-web',
                        returnStatus: true
                    )
                    
                    if (appRunning == 0) {
                        echo '✓ Application container is running'
                    } else {
                        error '✗ Application container is not running!'
                    }
                    
                    // Check if db container is running
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

        // ========================================
        // STAGE 6: DISPLAY LOGS
        // ========================================
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

    // ========================================
    // POST-BUILD ACTIONS
    // ========================================
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
