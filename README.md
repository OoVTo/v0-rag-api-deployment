# RAG API deployment

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/gtongs-projects-49e5ec16/v0-rag-api-deployment)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/sT9Is2Jl1mC)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/gtongs-projects-49e5ec16/v0-rag-api-deployment](https://vercel.com/gtongs-projects-49e5ec16/v0-rag-api-deployment)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/sT9Is2Jl1mC](https://v0.app/chat/sT9Is2Jl1mC)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

---

## 📚 Comprehensive Documentation

**Food Explorer** is a Retrieval-Augmented Generation (RAG) application that leverages AI to answer questions about food, cuisines, and culinary topics. The system combines document retrieval with LLM-powered generation to provide contextually accurate and knowledgeable responses.

### Tech Stack

- **Frontend**: Next.js 16.0.7 with React and TypeScript
- **UI Components**: Radix UI with Tailwind CSS
- **Backend**: Next.js API Routes
- **LLM Provider**: Groq API (llama-3.1-8b-instant model)
- **Hosting**: Vercel (edge deployment)
- **Data Storage**: In-memory food knowledge base (JSON)

### Key Features

- 🔍 **Smart Search**: Advanced similarity matching algorithm for document retrieval
- 🤖 **AI-Powered Responses**: Groq API integration for intelligent answer generation
- 🎨 **Modern UI**: Responsive design with gradient backgrounds and smooth interactions
- ⚡ **Edge Deployment**: Vercel's serverless infrastructure for global distribution
- 📊 **Real-time Feedback**: Loading states and error handling for user experience

### Documentation

- [🏗️ Architecture Comparison](ARCHITECTURE.md) - Python CLI → Cloud System → Web Application
- [⚡ Performance Analysis](PERFORMANCE.md) - Response times and UX metrics

---

## 📦 API Reference

### POST /api/rag

**Request**:
```json
{
  "question": "What is a traditional Italian pasta?"
}
```

**Response Success** (200):
```json
{
  "answer": "Pasta is a staple food made from durum wheat flour...",
  "sources": [
    {
      "id": "pasta_001",
      "text": "Traditional Italian pasta made from durum wheat..."
    }
  ]
}
```

**Response Error** (400/500):
```json
{
  "error": "GROQ_API_KEY is not configured"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| question | string | Yes | User's question about food |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| answer | string | AI-generated answer based on retrieved context |
| sources | array | Array of document sources used |
| sources[].id | string | Unique document identifier |
| sources[].text | string | Document content snippet |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (for local development)
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/OoVTo/v0-rag-api-deployment

# Install dependencies
cd v0-rag-api-deployment
npm install

# Configure environment
echo "GROQ_API_KEY=your-key-here" > .env.local
```

### Local Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in browser

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔐 Security & Best Practices

- **API Keys**: Store Groq API key in environment variables only
- **Input Validation**: Question parameter is trimmed and validated
- **Error Handling**: Generic error messages to prevent information leakage
- **CORS**: Configured for Vercel deployment
- **Rate Limiting**: Implement via Vercel middleware for production

---

## 📝 License & Attribution

Built with [v0.app](https://v0.app) | Deployed on [Vercel](https://vercel.com)