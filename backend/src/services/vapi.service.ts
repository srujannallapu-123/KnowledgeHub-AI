import jwt from "jsonwebtoken";

const voices: Record<string, Record<string, string>> = {
  male: {
    casual: "2BJW5coyhAzSr8STdHbE",
    formal: "c6SfcYrb2t09NHXiT80T",
  },
  female: {
    casual: "ZIlrSGI4jZqobxRKprJz",
    formal: "sarah",
  },
};

export function getVoiceId(voice: string, style: string) {
  return voices[voice]?.[style] || "sarah";
}

type AssistantConfig = {
  subject: string;
  topic: string;
  style: string;
  voiceId: string;
  durationSeconds: number;
};

export function configureAssistant({
  subject,
  topic,
  style,
  voiceId,
  durationSeconds,
}: AssistantConfig) {
  return {
    name: "Companion",

    maxDurationSeconds: durationSeconds,

    firstMessage:
      `Hello, let's start the session. Today we'll be talking about ${topic}.`,

    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },

    voice: {
      provider: "11labs",
      voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },

    model: {
      provider: "openai",
      model: "gpt-4",

      messages: [
        {
          role: "system",
          content: `
            You are a highly knowledgeable AI tutor teaching
            a real-time voice session with a student.

            Your goal is to help the student understand
            the given topic and subject.

            Tutor Guidelines:

            1. Stick to the given topic ${topic}
               and subject ${subject}.

            2. Keep the conversation natural, interactive
               and engaging.

            3. Break complex topics into smaller,
               understandable parts.

            4. Teach the student one concept at a time.

            5. Use practical examples when explaining
               difficult concepts.

            6. Regularly check whether the student
               understands your explanation.

            7. Give the student enough time to think
               and respond.

            8. Do not assume that a short pause means
               the student wants to end the session.

            9. Maintain the requested conversation
               style: ${style}.

            10. Keep responses short and clear,
                like a natural voice conversation.

            11. Avoid markdown formatting and unnecessary
                special characters because your responses
                will be spoken aloud.

            12. If the student does not understand,
                explain the concept using a simpler example.
          `,
        },
      ],
    },
  };
}


export class VapiRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Vapi request failed with status ${status}`);
    this.name = "VapiRequestError";
  }

  get isDefinitiveRejection(): boolean {
    return [400, 401, 403, 404, 422].includes(this.status);
  }
}

export async function createVapiCall(config: AssistantConfig) {
  const apiKey = process.env.VAPI_PRIVATE_API_KEY;
  const orgId = process.env.VAPI_ORG_ID;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_API_KEY is missing");
  }

  if (!orgId) {
    throw new Error("VAPI_ORG_ID is missing");
  }

  const publicToken = jwt.sign(
    {
      orgId,
      token: {
        tag: "public",
        restrictions: {
          allowTransientAssistant: true,
        },
      },
    },
    apiKey,
    {
      algorithm: "HS256",
      expiresIn: "60s",
    }
  );

  const response = await fetch(
    "https://api.vapi.ai/call/web",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: configureAssistant(config),
        roomDeleteOnUserLeaveEnabled: true,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const details = await response.json().catch(() => null);

    console.error("Vapi API request failed:", {
      status: response.status,
      message: details?.message,
    });

    throw new VapiRequestError(response.status);
  }

  const call = await response.json();

  if (!call.id) {
    throw new Error("Invalid Vapi call response");
  }

  return call;
}