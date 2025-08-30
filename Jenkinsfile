pipeline {
    agent any
    parameters {
        string(name: 'BRANCH', defaultValue: 'jenkins', description: 'Git branch to checkout')
    }
    environment {
        // Load from Jenkins Credentials Store
        JWT_SECRET = credentials('jwt-secret-base64-user-portfolio')
        MAIL_PASSWORD = credentials('mailtrap-password')
        JWT_EXPIRATION = '3600000'

        BRANCH = "${params.BRANCH}"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        VM_SSH_KEY = credentials('production-vm-ssh-key')
        VM_HOST = "${env.VM_HOST ?: '192.168.56.50'}"
        VM_USER = "${env.VM_USER ?: 'deploy'}"
        VM_PORT = "${env.VM_PORT ?: '22'}"
    }
    
    stages {
        stage('Set Version') {
            steps {
                script {
                    def baseVersion = readFile('VERSION').trim()
                    if (params.BRANCH == 'master') {
                        env.TAG = baseVersion
                    } else {
                        def cleanBranch = params.BRANCH.replaceAll(/[^a-zA-Z0-9]/, '-')
                        env.TAG = "${baseVersion}-${cleanBranch}-${BUILD_NUMBER}"
                    }
                    currentBuild.displayName = "${params.BRANCH}-${env.TAG}"
                }
            }
        }
        
         stage('Build & Test') {
            steps {
                sh '''#!/bin/bash
                    # Read base version from VERSION file
                    BASE_VERSION=$(cat VERSION | tr -d '\n\r')
                    
                    # Create appropriate tag based on branch
                    if [ "$BRANCH" = "main" ]; then
                        export TAG="$BASE_VERSION"
                        echo "Main branch - using version: $TAG"
                    else
                        # For non-main branches, append branch name and build number
                        CLEAN_BRANCH=$(echo "$BRANCH" | sed 's/[^a-zA-Z0-9]/-/g')
                        export TAG="${BASE_VERSION}-${CLEAN_BRANCH}-${BUILD_NUMBER}"
                        echo "Feature branch - using version: $TAG"
                    fi
                    
                    # Export environment variables for Docker Compose substitution
                    export DOCKER_USER="$DOCKERHUB_CREDENTIALS_USR"
                    export TAG="$TAG"
                    export JWT_SECRET="$JWT_SECRET"
                    export JWT_EXPIRATION="$JWT_EXPIRATION"
                    export MAIL_PASSWORD="$MAIL_PASSWORD"
                    export VM_HOST="$VM_HOST"
                    
                    # Replace only DOCKER_USER and TAG in image names (still needed for image references)
                    sed -i "s/DOCKER_USER/$DOCKERHUB_CREDENTIALS_USR/g" docker-compose.yml
                    sed -i "s/TAG/$TAG/g" docker-compose.yml
                    cat docker-compose.yml
                '''
                sh '''
                    echo "Building Docker images (tests will run automatically during build)..."
                    docker compose build
                    echo "All services built successfully with tests passing!"
                    echo "Listing built images:"
                    docker images | grep $DOCKERHUB_CREDENTIALS_USR
                '''
            }
        }
        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        # Read base version from VERSION file and create appropriate tag
                        BASE_VERSION=$(cat VERSION | tr -d '\n\r')
                        
                        # Create appropriate tag based on branch
                        if [ "$BRANCH" = "main" ]; then
                            export TAG="$BASE_VERSION"
                            echo "Main branch - using version: $TAG"
                            echo "Will push with version tag and latest tag"
                            export PUSH_LATEST=true
                        else
                            # For non-main branches, append branch name and build number
                            CLEAN_BRANCH=$(echo "$BRANCH" | sed 's/[^a-zA-Z0-9]/-/g')
                            export TAG="${BASE_VERSION}-${CLEAN_BRANCH}-${BUILD_NUMBER}"
                            echo "Feature branch - using version: $TAG"
                            echo "Will only push with feature version tag"
                            export PUSH_LATEST=false
                        fi
                        
                        # Export environment variables and substitute docker-compose.yml
                        export DOCKER_USER="$DOCKER_USER"
                        export TAG="$TAG"
                        export JWT_SECRET="$JWT_SECRET"
                        export JWT_EXPIRATION="$JWT_EXPIRATION"
                        export MAIL_PASSWORD="$MAIL_PASSWORD"
                        export VM_HOST="$VM_HOST"
                        
                        # Replace placeholders in docker-compose.yml
                        sed -i "s/DOCKER_USER/$DOCKER_USER/g" docker-compose.yml
                        sed -i "s/TAG/$TAG/g" docker-compose.yml
                        
                        echo "Logging in as: $DOCKER_USER"
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        
                        echo "Pushing images to Docker Hub..."
                        
                        docker compose push
                        
                        echo "Logout from Docker Hub"
                        docker logout
                    '''
                }
            }
        }
        // Deploy to VirtualBox VM via SSH
        stage('Deploy to VM') {
            steps {
                sh '''
                    # Setup SSH key
                    mkdir -p ~/.ssh
                    cp "$VM_SSH_KEY" ~/.ssh/vm_key
                    chmod 600 ~/.ssh/vm_key
                    
                    # Clean and create deploy directory on VM
                    ssh -i ~/.ssh/vm_key -o StrictHostKeyChecking=no -p $VM_PORT $VM_USER@$VM_HOST "rm -rf ~/deploy/portfolio-management && mkdir -p ~/deploy/portfolio-management"
                    
                    # Copy docker-compose.yml and mysql-init to VM
                    scp -i ~/.ssh/vm_key -o StrictHostKeyChecking=no -P $VM_PORT docker-compose.yml $VM_USER@$VM_HOST:~/deploy/portfolio-management/docker-compose.yml
                    
                    # Deploy on VM with environment variables
                    ssh -i ~/.ssh/vm_key -o StrictHostKeyChecking=no -p $VM_PORT $VM_USER@$VM_HOST "
                        cd ~/deploy/portfolio-management && 
                        # Set environment variables for Docker Compose
                        export JWT_SECRET='$JWT_SECRET' &&
                        export JWT_EXPIRATION='$JWT_EXPIRATION' &&
                        export MAIL_PASSWORD='$MAIL_PASSWORD' &&
                        export VM_HOST='$VM_HOST' &&
                        echo 'Environment variables set' &&
                        echo 'Stopping existing containers...' &&
                        docker compose down --remove-orphans || true &&
                        echo 'Pulling latest images...' &&
                        docker compose pull &&
                        echo 'Starting containers...' &&
                        docker compose up -d &&
                        echo 'Deployment completed successfully!'
                    "
                    
                    # Clean up SSH key
                    rm -f ~/.ssh/vm_key
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh '''
                        sleep 30
                        docker compose ps
                        
                        # Test backend health
                        curl -f http://localhost:3001/api/health || echo "Backend not ready yet"
                        
                        # Test frontend health  
                        curl -f http://localhost:3000 || echo "Frontend not ready yet"
                    '''
                }
            }
        }
    }
    
    post {
        failure {
            sh 'docker compose logs'
            sh 'docker compose down'
        }
    }
}