#!/bin/bash

echo "Setting up Open Agent Platform development environment..."

# Ensure required tools are installed
if ! [ -x "$(command -v node)" ]; then
  echo "Error: Node.js is not installed. Please install Node.js v18 or later." >&2
  exit 1
fi

if ! [ -x "$(command -v yarn)" ]; then
  echo "Installing Yarn..."
  npm install -g yarn
fi

# Install dependencies
echo "Installing dependencies..."
yarn install

# Create example env file if it doesn't exist
if [ ! -f ./apps/web/.env ]; then
  if [ -f ./apps/web/.env.example ]; then
    echo "Creating .env file from example..."
    cp ./apps/web/.env.example ./apps/web/.env
    echo "Please update your .env file with your own credentials."
  else
    echo "Warning: Could not find .env.example file. You'll need to create .env manually."
  fi
fi

# Run type checking
echo "Running type checking..."
yarn turbo:command typecheck --filter=web

# Run linting
echo "Running linting..."
yarn lint

# Start the development server
echo "\nSetup complete! You can now run the development server with:\n"
echo "yarn dev"

echo "\nFor additional details, see the README.md file."

echo "\nWould you like to start the development server now? (y/n)"
read -r answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  yarn dev
fi