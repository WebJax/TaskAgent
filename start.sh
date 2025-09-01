#!/bin/bash

# Quick start script for TaskAgent
echo "🎯 Starting TaskAgent..."

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "⚠️  MySQL seems to be stopped. Starting MySQL..."
    # Uncomment the line below if you're using Homebrew MySQL:
    # brew services start mysql
    echo "Please ensure MySQL is running before continuing."
fi

# Check if database exists
echo "🔍 Checking database..."
if ! mysql -u root -p2010Thuva -e "USE opgavestyring;" 2>/dev/null; then
    echo "📦 Setting up database..."
    npm run setup-db
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start server
echo "🚀 Starting server..."
npm start

echo "✅ TaskAgent should now be running at http://localhost:3000"
