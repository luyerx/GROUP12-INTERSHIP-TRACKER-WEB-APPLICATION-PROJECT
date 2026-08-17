"use client";

import { useMemo, useState } from "react";

import {
  ArrowUp,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  FileSearch,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type AssistantMode =
  | "general"
  | "summary"
  | "interview"
  | "skills"
  | "preparation";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  mode?: AssistantMode;
};

const quickActions = [
  {
    id: "summary" as const,
    title: "Summarise a job description",
    description:
      "Extract the main responsibilities, requirements, and key details from a role.",
    icon: FileSearch,
  },
  {
    id: "interview" as const,
    title: "Generate interview questions",
    description:
      "Create role-specific questions to help you prepare for an upcoming interview.",
    icon: MessageSquareText,
  },
  {
    id: "skills" as const,
    title: "Identify required skills",
    description:
      "Analyse a role and highlight the technical and professional skills employers expect.",
    icon: Target,
  },
  {
    id: "preparation" as const,
    title: "Create a preparation plan",
    description:
      "Turn a job description into practical preparation steps before applying or interviewing.",
    icon: Lightbulb,
  },
];

const sampleResponses: Record<
  Exclude<AssistantMode, "general">,
  string
> = {
  summary:
    "Here is a concise role summary:\n\n• The role focuses on supporting software development and maintaining web-based applications.\n• Key responsibilities include collaborating with developers, testing features, fixing issues, and contributing to documentation.\n• The employer is looking for strong communication, problem-solving ability, and familiarity with modern development tools.\n• The most important preparation areas are reviewing the required technologies and preparing examples of previous technical work.",

  interview:
    "Here are some interview questions you could practise:\n\n1. Tell me about a software project you have worked on and your contribution to it.\n2. How do you approach debugging when a feature does not behave as expected?\n3. Describe a time you worked with other people to complete a technical task.\n4. How would you prioritise several development tasks with similar deadlines?\n5. What interests you about this internship and the organisation?",

  skills:
    "The main skills I would highlight from this role are:\n\nTechnical skills\n• JavaScript / TypeScript\n• React or another modern frontend framework\n• Git and version control\n• Basic API integration\n• Testing and debugging\n\nProfessional skills\n• Communication\n• Teamwork\n• Problem solving\n• Time management\n• Willingness to learn",

  preparation:
    "Suggested preparation plan:\n\n1. Review the job description and highlight the top five requirements.\n2. Match each requirement with an example from your coursework or projects.\n3. Review the main technologies listed in the role.\n4. Prepare two teamwork examples and two problem-solving examples.\n5. Research the organisation, its products, and recent work.\n6. Prepare questions to ask the interviewer.\n7. Re-read your CV before the interview so your answers remain consistent.",
};

export default function AIAssistantPage() {
  const [mode, setMode] =
    useState<AssistantMode>("general");

  const [input, setInput] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const selectedAction = useMemo(
    () =>
      quickActions.find(
        (action) => action.id === mode
      ),
    [mode]
  );

  const selectQuickAction = (
    actionMode: Exclude<
      AssistantMode,
      "general"
    >
  ) => {
    setMode(actionMode);

    if (actionMode === "summary") {
      setInput(
        "Paste a job description here and summarise the role."
      );
    }

    if (actionMode === "interview") {
      setInput(
        "Generate interview questions for this internship role."
      );
    }

    if (actionMode === "skills") {
      setInput(
        "Analyse this role and identify the most important required skills."
      );
    }

    if (actionMode === "preparation") {
      setInput(
        "Create a preparation plan for this internship opportunity."
      );
    }
  };

  const generateResponse = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || isGenerating) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
      mode,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsGenerating(true);

    try {
      /*
       * Temporary AI simulation.
       * Later replace this block with the
       * real Gemini / OpenAI API request.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const response =
        mode === "general"
          ? "I can help you understand internship roles, prepare for interviews, identify required skills, and organise your preparation. Choose one of the AI tools or describe what you need help with."
          : sampleResponses[mode];

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        mode,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "AI assistant error:",
        error
      );

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "I could not generate a response. Please try again.",
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setMode("general");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />

              <p className="text-sm font-medium text-slate-500">
                AI career support
              </p>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              AI Assistant
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Analyse internship opportunities,
              prepare for interviews, identify
              important skills, and turn job
              descriptions into practical next
              steps.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            >
              <RotateCcw className="h-4 w-4" />
              New conversation
            </button>
          )}
        </div>

        {/* AI notice */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                AI-assisted career preparation
              </h2>

              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
                AI responses are designed to support
                your preparation and should be
                reviewed before using them in real
                applications or interviews.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          {/* Left tools */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  AI tools
                </p>

                <h2 className="mt-1 text-base font-semibold text-slate-950">
                  What would you like help with?
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {quickActions.map(
                  (action) => {
                    const Icon =
                      action.icon;

                    const active =
                      mode === action.id;

                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() =>
                          selectQuickAction(
                            action.id
                          )
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                active
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {
                                action.title
                              }
                            </p>

                            <p
                              className={`mt-1 text-xs leading-5 ${
                                active
                                  ? "text-slate-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {
                                action.description
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Best results
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Give the assistant enough context.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-xs leading-5 text-slate-500">
                <Tip>
                  Paste the relevant part of the
                  job description.
                </Tip>

                <Tip>
                  Include the role title and
                  organisation when possible.
                </Tip>

                <Tip>
                  Ask for specific output rather
                  than a very broad response.
                </Tip>
              </div>
            </section>
          </aside>

          {/* Main assistant */}
          <section className="flex min-h-170 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Assistant heading */}
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-950">
                      Internship AI
                    </h2>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Ready
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedAction
                      ? selectedAction.title
                      : "Career preparation assistant"}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <EmptyConversation
                  onSelectAction={
                    selectQuickAction
                  }
                />
              ) : (
                <div className="space-y-6">
                  {messages.map(
                    (message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                      />
                    )
                  )}

                  {isGenerating && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                        <Bot className="h-4 w-4" />
                      </div>

                      <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Analysing...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-4">
              {mode !== "general" && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white">
                    {selectedAction?.title}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setMode("general")
                    }
                    className="text-xs font-medium text-slate-400 transition hover:text-slate-700"
                  >
                    Clear mode
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
                <textarea
                  value={input}
                  disabled={isGenerating}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      void generateResponse();
                    }
                  }}
                  rows={4}
                  placeholder={
                    mode === "general"
                      ? "Ask about an internship role, interview, required skills, or preparation..."
                      : "Add a job description or extra context here..."
                  }
                  className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />

                <div className="flex items-center justify-between gap-4 px-2 pb-1">
                  <p className="text-xs text-slate-400">
                    Enter to send · Shift +
                    Enter for a new line
                  </p>

                  <button
                    type="button"
                    disabled={
                      !input.trim() ||
                      isGenerating
                    }
                    onClick={() =>
                      void generateResponse()
                    }
                    aria-label="Send message"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isGenerating ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">
                AI-generated content may be
                incomplete or inaccurate. Review
                important information before using
                it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyConversation({
  onSelectAction,
}: {
  onSelectAction: (
    mode: Exclude<
      AssistantMode,
      "general"
    >
  ) => void;
}) {
  return (
    <div className="flex min-h-105 flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        <Sparkles className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-950">
        How can I help with your internship?
      </h3>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Choose a common career task below or
        write your own question. You can paste
        information from a job description to
        receive more relevant guidance.
      </p>

      <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <StarterButton
          icon={
            <FileSearch className="h-4 w-4" />
          }
          title="Summarise a role"
          onClick={() =>
            onSelectAction("summary")
          }
        />

        <StarterButton
          icon={
            <MessageSquareText className="h-4 w-4" />
          }
          title="Interview questions"
          onClick={() =>
            onSelectAction(
              "interview"
            )
          }
        />

        <StarterButton
          icon={
            <Target className="h-4 w-4" />
          }
          title="Identify key skills"
          onClick={() =>
            onSelectAction("skills")
          }
        />

        <StarterButton
          icon={
            <Lightbulb className="h-4 w-4" />
          }
          title="Preparation plan"
          onClick={() =>
            onSelectAction(
              "preparation"
            )
          }
        />
      </div>
    </div>
  );
}

function StarterButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <span className="text-sm font-medium text-slate-800">
        {title}
      </span>
    </button>
  );
}

function MessageBubble({
  message,
}: {
  message: Message;
}) {
  const user =
    message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${
        user
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {!user && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
          user
            ? "rounded-tr-md bg-slate-950 text-white"
            : "rounded-tl-md border border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {message.content}
      </div>

      {user && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function Tip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

      <p>{children}</p>
    </div>
  );
}