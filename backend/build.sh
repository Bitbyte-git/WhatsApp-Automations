#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Building frontend dist assets..."
cd ../frontend && npm install && npm run build && cd ../backend

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Applying Neon PostgreSQL migrations..."
python manage.py migrate

echo "Seeding platform data..."
python manage.py seed_platform

echo "Deployment build finished successfully!"
