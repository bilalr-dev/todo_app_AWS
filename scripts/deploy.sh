#!/bin/bash

# Todo App Deployment Script
# This script deploys the application to AWS

echo "🚀 Deploying Todo App to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm run build
cd ..

# Deploy backend to EC2
echo "☁️ Deploying backend to EC2..."
# TODO: Add EC2 deployment commands

# Deploy frontend to S3
echo "☁️ Deploying frontend to S3..."
# TODO: Add S3 deployment commands

echo "✅ Deployment complete!"
