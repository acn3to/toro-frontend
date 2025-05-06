# Toro AI Assistant - Angular Frontend

A simple Angular frontend for the Toro AI Assistant challenge.

## Overview

This is a minimal Angular implementation of the Toro AI Assistant frontend, featuring:

- Login screen
- Chat interface
- WebSocket connection for real-time updates
- Messages history

## Requirements

- Node.js (v14+)
- npm or yarn

## Installation

1. Clone this repository
2. Install the dependencies:

```bash
npm install
```

## Running the Application

You can run the application in two ways:

### Using Angular CLI

```bash
npm start
```

or

```bash
ng serve --open
```

### Using the Python Script

```bash
python serve.py
```

## Architecture

The application is organized into:

- Components:
  - LoginComponent: Simple login form
  - ChatComponent: Chat interface with message history
- Services:
  - AuthService: Handles authentication
  - QuestionsService: Manages API communication and WebSocket

## API Integration

The application integrates with:
- REST API for sending questions
- WebSocket for receiving real-time updates
