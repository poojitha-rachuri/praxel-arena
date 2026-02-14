# Voice Integration Setup Guide (ElevenLabs)

This guide explains how to configure the ElevenLabs voice integration for Praxel Arena's AI Challenger feature.

## Prerequisites

1. An ElevenLabs account with Agents Platform access
2. An API key from ElevenLabs

## Step 1: Create an ElevenLabs Agent

1. Go to [ElevenLabs Agents Platform](https://elevenlabs.io)
2. In the left sidebar, click the platform switcher at the top
3. Choose **Agents Platform**
4. Click **Agents** → **+ New Agent**
5. Choose **Blank Agent** to start from scratch
6. Name it: `Praxel Challenger`

## Step 2: Configure Agent Settings

### Basic Configuration

In the agent settings, configure:

- **First Message**: Leave empty (we override this dynamically)
- **System Prompt**: Leave empty (we override this dynamically)
- **Voice**: Choose a professional-sounding voice (e.g., "Adam", "Rachel", or any voice that sounds like a business coach)
- **Language**: English (or your preferred language)

### Advanced Settings → Client Events (CRITICAL!)

Go to **Advanced** → **Client Events** and enable these events:

- ✅ `agent_response` - Required for AI message transcripts
- ✅ `user_transcript` - Required for user speech transcripts

**Without these events enabled, the `onMessage` callback won't receive any transcripts!**

### Authentication

The current implementation uses **signed URLs** for authentication:

1. Go to **Security** settings
2. Keep the agent as **Private** (requires authentication)
3. The backend will generate signed URLs for each session

## Step 3: Get Your Credentials

1. Copy the **Agent ID** (displayed below the agent name, format: `agent_xxxxx`)
2. Go to **API Keys** in ElevenLabs dashboard
3. Create a new API key if needed

## Step 4: Configure Environment Variables

Add to your `.env.local`:

```bash
# ElevenLabs Conversational AI
ELEVENLABS_API_KEY=xi_your_api_key_here
ELEVENLABS_AGENT_ID=agent_your_agent_id_here
```

## Step 5: Test the Integration

1. Start the dev server: `npm run dev`
2. Navigate to `/challenges`
3. Select a challenge type
4. Choose **Voice Call** mode
5. Allow microphone access when prompted

## Troubleshooting

### Voice button shows "Not configured"

- Check that `ELEVENLABS_AGENT_ID` and `ELEVENLABS_API_KEY` are set
- Verify the API key is valid

### Connection fails / Error state

1. Check browser console for `[voice]` prefixed logs
2. Check server logs for `[elevenlabs]` prefixed logs
3. Verify the agent ID is correct
4. Ensure client events are enabled in the agent settings

### No transcripts appearing

- **Most common issue**: Client events not enabled
- Go to agent settings → Advanced → Client Events
- Enable `agent_response` and `user_transcript`

### "Voice unavailable" error appears briefly

- Microphone permission was denied
- Check browser settings and allow microphone access

### WebSocket connection issues

- The signed URL might have expired (they're short-lived)
- Try refreshing and starting a new session

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VoiceToggle   │────▶│  /api/elevenlabs │────▶│   ElevenLabs    │
│   (Client)      │     │  /signed-url     │     │   API           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                 │
        │                                                 │
        ▼                                                 ▼
┌─────────────────┐     WebSocket Connection      ┌─────────────────┐
│ @elevenlabs/    │◀──────────────────────────────▶│   ElevenLabs    │
│ react SDK       │     (Audio + Transcripts)     │   Agent         │
└─────────────────┘                               └─────────────────┘
```

## SDK Version

This implementation uses `@elevenlabs/react@^0.14.0`. Key SDK requirements:

- `startSession({ signedUrl, connectionType: "websocket" })` for signed URL auth
- Overrides format: `{ overrides: { agent: { prompt: {...}, firstMessage: "..." } } }`
- Client events must be enabled in the ElevenLabs dashboard for `onMessage` to work

## Agent Prompt Template

When a skill context is provided, the backend generates a dynamic prompt. Here's the template:

```
You are the Praxel AI Challenger - a sharp, professional business coach 
specializing in {skillName}. You are running a {challengeType} via voice conversation.

RULES:
1. Keep each response under 60 words. Voice conversations must be concise.
2. Ask ONE probing question per turn. Make it scenario-based.
3. Never reveal correct answers directly - guide the user to discover insights.
4. Stay focused on {skillName}. If the user goes off-topic, redirect.
5. Speak naturally - no bullet points, no numbered lists, no markdown.
6. Address the user as a professional peer.
7. After 4-5 exchanges, wrap up with a brief actionable insight.
8. Sound like a senior colleague challenging their thinking, not a tutor.
```

## Multiple Agents (Optional)

If you want different voices/personalities for different challenge types, you can:

1. Create multiple agents in ElevenLabs (one per challenge type)
2. Modify `/api/elevenlabs/signed-url/route.ts` to select agent ID based on `challengeType`
3. Store multiple agent IDs in environment variables:
   ```bash
   ELEVENLABS_AGENT_INTERVIEW=agent_xxx
   ELEVENLABS_AGENT_DRILL=agent_yyy
   ELEVENLABS_AGENT_COACHING=agent_zzz
   ```
