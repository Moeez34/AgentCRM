AgentCRM
An AI-powered CRM for building, configuring, and managing autonomous sales agents.
AgentCRM is a modern full-stack CRM platform designed for sales teams that want to automate repetitive outreach while keeping complete control over how their AI agents behave.
Configure an agent's personality, target customer profile, outreach rules, and automation settings — then let the agent handle repetitive sales workflows.
✨ Features
🤖 AI Sales Agents — Create and manage autonomous sales agents
🎛️ Agent Playground — Configure agent behavior, creativity, tone, and rules
🎯 Customer ICP Configuration — Define exactly who the agent should target
✉️ Automated Outreach — Configure email sequences and follow-ups
📊 CRM Dashboard — Track leads, prospects, conversations, and agent activity
🔄 Automation Controls — Enable or disable autonomous workflows
🔐 Authentication — Secure user authentication and protected resources
⚡ Real-time Agent Activity — Monitor what your agents are doing
📱 Responsive UI — Designed for desktop and modern web experiences



Agent Playground
The core of AgentCRM is the Agent Playground.

Sales representatives can configure:
This turns AI configuration into an intuitive workspace instead of hiding everything behind complicated prompts.
Setting	Description
AI Creativity	Controls how deterministic or creative the agent is
Communication Tone	Casual, Direct, Academic, Humorous
Customer ICP	Defines the ideal customer profile
Auto Sequences	Enables automated follow-ups
Agent Status	Activate or pause an agent

Architecture
                    ┌──────────────────┐
                    │   React Client   │
                    │   Dashboard UI   │
                    └────────┬─────────┘
                             │
                             │ HTTP / REST
                             ▼
                    ┌──────────────────┐
                    │   Node.js API    │
                    │    Express.js    │
                    └────────┬─────────┘
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ Database │    │ AI Layer │    │  Auth    │
       └──────────┘    └──────────┘    └──────────┘
                             │
                             ▼
                     AI Sales Agents



Tech Stack
Frontend
React
JavaScript / TypeScript
Tailwind CSS
Framer Motion

Backend
Node.js
Express.js
REST APIs
JWT Authentication

Database
MongoDB / PostgreSQL
AI
LLM-powered agent workflows
Configurable agent parameters
Automated sales reasoning and outreach
Development
Git & GitHub
Postman
VS Code
Docker
