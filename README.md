# User Portfolio Management - DevOps Practice Project

This project is designed for practicing DevOps skills and technologies.

## Tech Stack

**Frontend:** Angular 20+ with Tailwind CSS
**Backend:** Java Spring Boot with JWT authentication
**Database:** PostgreSQL
**Infrastructure:** Docker & Docker Compose

## Quick Start

```bash
# Clone the repository
git clone <repository-url>

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your JWT_SECRET and MAIL_PASSWORD

# Run with Docker Compose
docker compose up -d

# Access the application
# Frontend: http://localhost:8083
# Backend API: http://localhost:8082
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# JWT Secret Key (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret-key-here

# Mailtrap API token for email service
MAIL_PASSWORD=your-mailtrap-api-token-here
```

## Features

- User registration and authentication
- Email-based login system
- JWT token authentication
- Responsive design
- Dockerized microservices

## Development

This project demonstrates:
- Containerization with Docker
- Multi-service orchestration
- Database integration
- Frontend-backend communication
- Modern web development practices

**Note:** This is a practice project focused on DevOps implementation and deployment strategies.