# Streaming AI Responses in Next.js 16 with Anthropic SDK

**Research Date**: February 13, 2026
**Stack**: Next.js 16.1.6, @anthropic-ai/sdk 0.74.0, React 19.2.3

## Executive Summary

There are **3 main approaches** to stream Claude responses token-by-token in Next.js 16 App Router:

1. **Vercel AI SDK** (Recommended) - Unified streaming with `useChat` hook
2. **Native Anthropic SDK** - Direct stream handling with `ReadableStream`
3. **Server-Sent Events (SSE)** - Custom implementation with `text/event-stream`

## Approach 1: Vercel AI SDK (Recommended)

The Vercel AI SDK provides the cleanest abstraction for streaming chat interfaces with Anthropic.

### Installation

```bash
npm install ai @ai-sdk/anthropic
```

### API Route (`app/api/chat/route.ts`)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    maxTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
}
```

### Client Component (`components/chat.tsx`)

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === 'user' ? 'bg-blue-50 ml-auto' : 'bg-gray-50'
            }`}
          >
            <p className="font-semibold">
              {message.role === 'user' ? 'You' : 'Claude'}
            </p>
            {message.parts.map((part, idx) => {
              if (part.type === 'text') {
                return <div key={idx} className="mt-1">{part.text}</div>;
              }
            })}
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500 animate-pulse">Claude is thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Ask Claude something..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

### Benefits

- **Zero boilerplate** for streaming logic
- **Automatic message state management**
- **Built-in loading states** and error handling
- **Optimistic UI updates** built-in
- **Type-safe** message handling
- **Compatible with all AI providers** (OpenAI, Anthropic, Google, etc.)

### Integration with Existing Code

Your current `lib/ai/client.ts` uses non-streaming calls. To add streaming:

```typescript
// lib/ai/streaming-client.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function streamChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    maxTokens: 4096,
  });

  return result.toUIMessageStreamResponse();
}
```

---

## Approach 2: Native Anthropic SDK + ReadableStream

For more control over the streaming process, use the Anthropic SDK directly.

### API Route (`app/api/chat/route.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  // Create a ReadableStream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages: anthropicMessages,
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta') {
            // Send each text chunk to the client
            const chunk = encoder.encode(event.delta.text);
            controller.enqueue(chunk);
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

### Client Component

```typescript
'use client';

import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        // Update the last message (assistant's response)
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantMessage,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <p className="font-semibold">
              {message.role === 'user' ? 'You' : 'Claude'}
            </p>
            <div className="mt-1">{message.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Ask Claude something..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

### Benefits

- **Full control** over streaming behavior
- **No additional dependencies** beyond @anthropic-ai/sdk
- **Direct access** to all stream events
- **Lower-level** for custom implementations

---

## Approach 3: Server-Sent Events (SSE)

Traditional SSE pattern for streaming.

### API Route (`app/api/chat/route.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages,
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta') {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client with EventSource

```typescript
'use client';

import { useState, useRef } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Note: EventSource only supports GET requests
    // You'll need to use fetch with response.body.getReader() instead
    // This is just for illustration

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              setMessages((prev) => {
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = {
                  ...last,
                  content: last.content + parsed.text,
                };
                return newMessages;
              });
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Same UI as previous examples
    <div>
      {/* ... */}
    </div>
  );
}
```

---

## React 19 Best Practices for Streaming UI

### 1. Use `useOptimistic` for Instant Feedback

React 19's `useOptimistic` hook provides instant UI updates while waiting for server responses.

```typescript
'use client';

import { useOptimistic, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
};

export default function OptimisticChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  const handleSend = async (text: string) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
    };

    // Optimistically add user message
    addOptimisticMessage(userMessage);

    // Optimistically add placeholder for assistant
    const assistantId = crypto.randomUUID();
    addOptimisticMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      pending: true,
    });

    // Send to server and stream response
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    // Stream handling...
    // When done, update real state
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  return (
    <div>
      {optimisticMessages.map((message) => (
        <div key={message.id}>
          {message.pending && <span className="animate-pulse">...</span>}
          {message.content}
        </div>
      ))}
    </div>
  );
}
```

### 2. Pair with `startTransition` for Responsive UI

```typescript
import { startTransition } from 'react';

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  startTransition(() => {
    sendMessage({ text: input });
    setInput('');
  });
};
```

### 3. Handle Errors Gracefully

```typescript
const [error, setError] = useState<string | null>(null);

try {
  // streaming logic
} catch (err) {
  setError(err instanceof Error ? err.message : 'Something went wrong');
  // Automatically reverts optimistic updates
}
```

---

## Comparison Matrix

| Feature | Vercel AI SDK | Native Anthropic SDK | SSE Pattern |
|---------|---------------|---------------------|-------------|
| Setup Complexity | Low | Medium | High |
| Dependencies | `ai`, `@ai-sdk/anthropic` | `@anthropic-ai/sdk` | `@anthropic-ai/sdk` |
| Type Safety | Excellent | Good | Manual |
| State Management | Built-in | Manual | Manual |
| Loading States | Built-in | Manual | Manual |
| Error Handling | Built-in | Manual | Manual |
| Provider Agnostic | Yes | No | No |
| Fine-grained Control | Medium | High | High |
| Best For | Chat UIs | Custom implementations | Legacy systems |

---

## Integration with Your Project

### Current State

Your project uses:
- Non-streaming AI calls in `lib/ai/client.ts`
- Evaluation happens in `app/api/evaluate/route.ts`
- No existing streaming infrastructure

### Recommended Implementation Path

1. **Install Vercel AI SDK**
   ```bash
   npm install ai @ai-sdk/anthropic
   ```

2. **Create streaming API route**
   ```typescript
   // app/api/chat/route.ts
   import { anthropic } from '@ai-sdk/anthropic';
   import { streamText } from 'ai';
   import { auth } from '@clerk/nextjs/server';

   export async function POST(req: Request) {
     const { userId } = await auth();
     if (!userId) {
       return new Response('Unauthorized', { status: 401 });
     }

     const { messages } = await req.json();

     const result = streamText({
       model: anthropic('claude-sonnet-4-5-20250929'),
       messages,
       maxTokens: 4096,
     });

     return result.toUIMessageStreamResponse();
   }
   ```

3. **Create chat component**
   ```typescript
   // components/interactions/streaming-chat.tsx
   'use client';

   import { useChat } from '@ai-sdk/react';
   import { DefaultChatTransport } from 'ai';

   export function StreamingChat() {
     const { messages, sendMessage, isLoading } = useChat({
       transport: new DefaultChatTransport({ api: '/api/chat' }),
     });

     // Render logic...
   }
   ```

4. **Keep existing non-streaming for evaluations**
   - Your `lib/ai/client.ts` can stay as-is for sprint generation/evaluation
   - Use streaming only for real-time chat interfaces

---

## Performance Considerations

### 1. Rate Limiting

```typescript
// app/api/chat/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(req: Request) {
  const { userId } = await auth();
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // streaming logic...
}
```

### 2. Token Streaming Optimization

```typescript
// Use smaller max_tokens for faster initial response
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  maxTokens: 1024, // Start with less, increase if needed
});
```

### 3. Client-Side Debouncing

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSend = useDebouncedCallback((text: string) => {
  sendMessage({ text });
}, 300);
```

---

## Error Handling Patterns

### Server-Side

```typescript
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      messages,
      onError: (error) => {
        console.error('Streaming error:', error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Client-Side

```typescript
const { messages, sendMessage, error, reload } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
  onError: (error) => {
    console.error('Chat error:', error);
    // Show error toast
  },
});

return (
  <div>
    {error && (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-800">Error: {error.message}</p>
        <button onClick={reload}>Retry</button>
      </div>
    )}
    {/* messages */}
  </div>
);
```

---

## Testing Strategies

### 1. Mock Streaming Responses

```typescript
// __tests__/chat.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '@/components/chat';

// Mock fetch for streaming
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Hello'));
        controller.enqueue(new TextEncoder().encode(' world'));
        controller.close();
      },
    }),
  })
);

test('renders streamed response', async () => {
  render(<Chat />);

  const input = screen.getByPlaceholderText('Ask Claude something...');
  const button = screen.getByText('Send');

  await userEvent.type(input, 'Hello');
  await userEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests with Railway

Since you're using Railway, test streaming in staging:

```typescript
// e2e/chat.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('chat streams response', async ({ page }) => {
  await page.goto('/chat');

  await page.fill('input[placeholder*="Ask Claude"]', 'Hello');
  await page.click('button:has-text("Send")');

  // Wait for streaming to complete
  await expect(page.locator('.assistant-message').last()).toContainText(
    'Hello',
    { timeout: 10000 }
  );
});
```

---

## Sources

- [AI SDK by Vercel - Introduction](https://ai-sdk.dev/docs/introduction)
- [AI SDK Providers: Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)
- [Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [React 19 useOptimistic](https://codefinity.com/blog/React-19-useOptimistic)
- [useOptimistic – React Official Docs](https://react.dev/reference/react/useOptimistic)
- [React v19 Release](https://react.dev/blog/2024/12/05/react-19)
- [Anthropic SDK TypeScript - GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [Next.js 16 Route Handlers - GitHub](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/03-file-conventions/route.mdx)

---

## Next Steps

1. **Start with Vercel AI SDK** for chat interfaces (lowest friction)
2. **Keep existing non-streaming** for sprint generation/evaluation
3. **Add rate limiting** to prevent abuse
4. **Implement error boundaries** with React 19's error handling
5. **Test streaming** in Railway staging environment
6. **Monitor token usage** via Anthropic dashboard
7. **Consider caching** common responses with Redis

---

## Questions for Your Use Case

1. **Where do you want streaming?**
   - Sprint feedback? (consider keeping non-streaming for structured JSON)
   - Help/chat interface? (perfect for streaming)
   - Duel analysis? (mixed - could stream explanation but need JSON scores)

2. **Do you need tool calling?**
   - AI SDK supports streaming tool calls
   - Native SDK gives more control over tool execution

3. **Budget for tokens?**
   - Streaming sends same tokens, but user perceives faster response
   - Consider max_tokens limits per request

Let me know which approach you'd like to implement first.
