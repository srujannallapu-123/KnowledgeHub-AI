"use client";

import { getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { CompanionComponentProps, SavedMessage } from "@/types";
import { addToSessionHistory } from "@/lib/actions/companion.actions";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";

import {
  Bot,
  User,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  AudioLines,
  Loader2,
} from "lucide-react";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const CompanionComponent = ({
  companionId,
  subject,
  name,
  userName,
  userImage,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(
    CallStatus.INACTIVE
  );

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [error, setError] = useState("");

  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const sessionStartedRef = useRef(false);
  const callRequestedRef = useRef(false);

  // Control the AI speaking animation
  useEffect(() => {
    if (isSpeaking) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.stop();
    }
  }, [isSpeaking]);

  // Automatically scroll to the latest message
  useEffect(() => {
    const container = transcriptRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Listen to Vapi events
  useEffect(() => {
    const onCallStart = () => {
      sessionStartedRef.current = true;
      setCallStatus(CallStatus.ACTIVE);
      setError("");
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
      setIsMuted(false);
      callRequestedRef.current = false;

      if (sessionStartedRef.current) {
        sessionStartedRef.current = false;

        void addToSessionHistory(companionId).catch(() => {
          setError("Unable to save learning session history.");
        });
      }
    };

    const onMessage = (message: Message) => {
      if (
        message.type === "transcript" &&
        message.transcriptType === "final" &&
        typeof message.transcript === "string" &&
        message.transcript.trim() &&
        (message.role === "assistant" ||
          message.role === "user")
      ) {
        const newMessage: SavedMessage = {
          role: message.role,
          content: message.transcript,
        };

        setMessages((previous) => {
  const lastMessage = previous[previous.length - 1];

  if (lastMessage && lastMessage.role === newMessage.role) {
    return [
      ...previous.slice(0, -1),
      {
        ...lastMessage,
        content: `${lastMessage.content} ${newMessage.content}`,
      },
    ];
  }

  return [...previous, newMessage];
});
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: unknown) => {
      console.error("Vapi error:", error);

      setError(
        "Something went wrong with the voice session."
      );

      setCallStatus((previous) =>
        previous === CallStatus.CONNECTING
          ? CallStatus.INACTIVE
          : previous
      );
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

   return () => {
  vapi.off("call-start", onCallStart);
  vapi.off("call-end", onCallEnd);
  vapi.off("message", onMessage);
  vapi.off("speech-start", onSpeechStart);
  vapi.off("speech-end", onSpeechEnd);
  vapi.off("error", onError);

  if (callRequestedRef.current) {
    callRequestedRef.current = false;

    vapi.stop();

    if (sessionStartedRef.current) {
      sessionStartedRef.current = false;

      void addToSessionHistory(companionId).catch((error) => {
        console.error("Failed to save session history:", error);
      });
    }
  }
};
  }, [companionId]);

  // Toggle the microphone
  const toggleMicrophone = () => {
    const muted = vapi.isMuted();

    vapi.setMuted(!muted);
    setIsMuted(!muted);
  };

  // Start a new learning session
  const handleCall = async () => {
    if (
      callStatus === CallStatus.CONNECTING ||
      callStatus === CallStatus.ACTIVE
    ) {
      return;
    }

    setMessages([]);
    setError("");
    setIsSpeaking(false);
    setIsMuted(false);
    setCallStatus(CallStatus.CONNECTING);
    callRequestedRef.current = true;

    try {
      const call = await vapi.start(companionId);

      if (!call) {
        throw new Error("Unable to start voice session");
      }
    } catch (error) {
      console.error("Failed to start session:", error);

      setCallStatus(CallStatus.INACTIVE);

      callRequestedRef.current = false;

      setError(
        "Unable to start the session. Please try again."
      );
    }
  };

  // End the learning session
  const handleDisconnect = () => {
    vapi.stop();
  };

  const isActive = callStatus === CallStatus.ACTIVE;
  const isConnecting =
    callStatus === CallStatus.CONNECTING;

  return (
    <section className="flex w-full flex-col gap-6">
      {/* Voice session */}
      <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
        {/* AI Tutor */}
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Bot size={18} />
              AI Tutor
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isActive ? "Connected" : "Standby"}
            </span>
          </div>

          <div
            className="relative flex size-40 items-center justify-center overflow-hidden rounded-3xl"
            style={{
              backgroundColor: getSubjectColor(subject),
            }}
          >
            {isActive ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="size-40"
              />
            ) : (
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={85}
                height={85}
              />
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">{name}</h2>

            <p className="mt-1 text-sm text-slate-500">
              {isSpeaking
                ? "Speaking..."
                : isActive
                  ? "Listening..."
                  : "Ready to teach"}
            </p>
          </div>
        </div>

        {/* User */}
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <User size={18} />
              Learner
            </span>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#D94320]">
              You
            </span>
          </div>

          <div className="flex size-40 items-center justify-center rounded-3xl bg-orange-50">
            <Image
              src={userImage}
              alt={userName}
              width={90}
              height={90}
              className="size-[90px] rounded-full object-cover"
            />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">
              {userName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isMuted
                ? "Microphone muted"
                : isActive
                  ? "Microphone enabled"
                  : "Ready to learn"}
            </p>
          </div>
        </div>
      </div>

      {/* Session controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={toggleMicrophone}
          disabled={!isActive}
          aria-label={
            isMuted
              ? "Unmute microphone"
              : "Mute microphone"
          }
          className={`flex size-12 items-center justify-center rounded-xl transition-colors disabled:opacity-40 ${
            isMuted
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {isMuted ? (
            <MicOff size={22} />
          ) : (
            <Mic size={22} />
          )}
        </button>

        <button
          type="button"
          onClick={isActive ? handleDisconnect : handleCall}
          disabled={isConnecting}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-white transition-colors ${
            isActive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-[#D94320] hover:bg-[#BF3516]"
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />
              Connecting...
            </>
          ) : isActive ? (
            <>
              <PhoneOff size={19} />
              End Session
            </>
          ) : (
            <>
              <Phone size={19} />
              Start Session
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Live conversation transcript */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Transcript header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-[#D94320]">
              <MessageSquare size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Conversation Transcript
              </h2>

              <p className="text-xs text-slate-500">
                Follow your learning conversation
              </p>
            </div>
          </div>

          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                isActive
                  ? "animate-pulse bg-emerald-500"
                  : "bg-slate-400"
              }`}
            />

            {isActive
              ? "Live"
              : callStatus === CallStatus.FINISHED
                ? "Session ended"
                : "Not started"}
          </span>
        </div>

        {/* Conversation messages */}
        <div
          ref={transcriptRef}
          role="log"
          aria-live="polite"
          className="flex h-[380px] flex-col gap-6 overflow-y-auto bg-slate-50/50 p-6 max-sm:h-[320px] max-sm:p-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#D94320]">
                <MessageSquare size={28} />
              </div>

              <h3 className="font-semibold text-slate-700">
                {isActive
                  ? "Waiting for conversation..."
                  : "Your conversation starts here"}
              </h3>

              <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                {isActive
                  ? "Your messages will appear as you speak."
                  : "Start a voice session to see the conversation with your AI tutor in real time."}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isAssistant =
                message.role === "assistant";

              return (
                <div
                  key={index}
                  className={`flex shrink-0 items-start gap-3 ${
                    isAssistant
                      ? "justify-start"
                      : "flex-row-reverse justify-start"
                  }`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      isAssistant
                        ? "bg-orange-100 text-[#D94320]"
                        : "bg-[#D94320] text-white"
                    }`}
                  >
                    {isAssistant ? (
                      <Bot size={19} />
                    ) : (
                      <User size={19} />
                    )}
                  </div>

                  <div
                    className={`flex max-w-[80%] min-w-0 flex-col gap-1 ${
                      isAssistant
                        ? "items-start"
                        : "items-end"
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-500">
                      {isAssistant ? name : "You"}
                    </span>

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                        isAssistant
                          ? "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                          : "rounded-tr-sm bg-[#D94320] text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Transcript footer */}
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          <AudioLines
            size={17}
            className={
              isActive
                ? "animate-pulse text-emerald-500"
                : "text-slate-400"
            }
          />

          {isActive
            ? "Live transcription is enabled"
            : "Transcripts are not saved by this application"}
        </div>
      </section>
    </section>
  );
};

export default CompanionComponent;