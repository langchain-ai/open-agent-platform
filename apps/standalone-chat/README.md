# Standalone Chat

A standalone Next.js chat interface for LangGraph deployments with inbox/threads toggle and interrupt handling.

## Features

- 💬 Full chat interface with message history
- 📥 Inbox view with thread management
- ⚡ Interrupt handling and human-in-the-loop support
- 📝 Task/files sidebar
- 🔧 Easy configuration via UI

## Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure environment:**
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_LANGSMITH_API_KEY=lsv2_pt_your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   yarn dev
   ```

4. **Configure deployment:**
   - Open http://localhost:3001
   - Click "Open Configuration" or the Settings button
   - Enter your LangGraph deployment URL (e.g., `https://your-deployment.langsmith.com`)
   - Enter your assistant ID (e.g., `asst_...`)
   - Click Save

## Configuration

The app stores configuration in browser localStorage:
- **Deployment URL**: Your LangGraph deployment endpoint
- **Assistant ID**: The ID of your agent/assistant

The LangSmith API key is set via environment variable for security.

## Usage

Once configured, you can:
- Chat with your agent directly
- View and manage threads in the inbox
- Handle interrupts when your agent needs input
- See tasks and files in the sidebar
- Toggle debug mode for step-by-step execution

## Development

Built with:
- Next.js 15
- React 19
- LangGraph SDK
- Tailwind CSS
- shadcn/ui components
