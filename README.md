# User Portfolio Management - DevOps Practice Project

This project is designed for practicing DevOps skills and technologies with Jenkins CI/CD integration.

## Tech Stack

**Frontend:** Angular 20+ with Tailwind CSS  
**Backend:** Java Spring Boot with JWT authentication  
**Database:** PostgreSQL  
**Infrastructure:** Docker & Docker Compose  
**CI/CD:** Jenkins Pipeline

## Quick Start

### Local Development
```bash
# Clone the repository
git clone <repository-url>

# Set environment variables and run
export JWT_SECRET="your-secure-jwt-secret-key"
export MAIL_PASSWORD="your-mailtrap-api-token"
export JWT_EXPIRATION="3600000"

docker compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Jenkins Deployment
This project is configured for automated deployment via Jenkins Pipeline.

## Environment Variables

The application requires these environment variables to be configured in Jenkins:

| Variable | Description | Jenkins Configuration |
|----------|-------------|----------------------|
| `JWT_SECRET` | Secure JWT signing key (base64 encoded) | Credentials Store (Secret Text) |
| `MAIL_PASSWORD` | Email service API token | Credentials Store (Secret Text) |
| `JWT_EXPIRATION` | Token expiration time in ms | Global Environment Variable |

### Jenkins Setup
1. **Add Credentials:**
   - Go to `Jenkins → Manage Jenkins → Credentials`
   - Add `jwt-secret-credential-id` (Secret Text)
   - Add `mail-password-credential-id` (Secret Text)

2. **Configure Pipeline:**
   - Create new Pipeline job
   - Use SCM: This repository
   - Pipeline script: `Jenkinsfile`

3. **Environment Variables:**
   - `Jenkins → Manage Jenkins → Configure System`
   - Add `JWT_EXPIRATION=3600000` in Global Properties

## Features

- User registration and authentication
- Email-based login system  
- JWT token authentication
- Password reset functionality
- Responsive design with Tailwind CSS
- Dockerized microservices architecture
- Service-to-service communication via Docker networks

## Architecture

The application uses a microservices architecture with Docker networking:

- **Frontend**: Angular app served via Nginx (Port 3000)
- **Backend**: Spring Boot API (Port 3001) 
- **Email Service**: Node.js email service (Port 3002)
- **Database**: PostgreSQL (Internal network only)

Services communicate using Docker service names instead of localhost.

## Development & DevOps Practices

This project demonstrates:
- **Containerization**: Multi-stage Docker builds
- **Orchestration**: Docker Compose with custom networks
- **CI/CD**: Jenkins Pipeline automation
- **Security**: Environment variable injection, no hardcoded secrets
- **Configuration Management**: Runtime environment configuration
- **Service Discovery**: Docker network-based communication
- **Infrastructure as Code**: Declarative Docker Compose configuration

## Local Testing

```bash
# Generate JWT secret
openssl rand -base64 64

# Test environment injection  
export JWT_SECRET="test-secret"
export MAIL_PASSWORD="test-password"
docker compose config | grep -A 5 environment
```

**Note:** This is a practice project focused on DevOps implementation, CI/CD pipelines, and containerized deployment strategies.