"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageSquare, Phone, Send, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { cn } from "@/lib/utils";
import { answer } from "../lib/engine";
import type { BotReply, ChatMessage, KnowledgeSnapshot } from "../types";

/**
 * BRD Home blueprint §11 — the floating assistant, present on every page.
 *
 * Everything runs in the browser against a snapshot of our own data: no API
 * call, no external AI, no network round-trip. That is what lets it answer
 * instantly and never invent a fact.
 */

const OPENING: BotReply = {
  text: "Hello. I'm the JMS Group assistant. I answer only from our own project data — so if I don't know something, I'll say so and put you through to an advisor. What are you looking for?",
  suggestions: [
    "Show me residential projects",
    "What is ready to move?",
    "Residential under 1.5 cr",
    "Book a site visit",
  ],
};

let messageId = 0;
const nextId = () => `msg-${(messageId += 1)}`;

export function ChatbotWidget({ knowledge }: { knowledge: KnowledgeSnapshot }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "msg-0", role: "assistant", reply: OPENING },
  ]);

  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    if (!open) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Escape closes; focus moves into the panel when it opens.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: nextId(), role: "user", reply: { text: trimmed } },
      { id: nextId(), role: "assistant", reply: answer(trimmed, knowledge) },
    ]);
    setInput("");
  }

  const whatsappHref = `https://wa.me/${knowledge.company.whatsapp}`;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {/* --- Panel -------------------------------------------------------- */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="JMS Group assistant"
          className="flex h-[min(34rem,calc(100svh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-sm border border-border bg-white shadow-luxe-lg"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-3 bg-navy-900 p-4">
            <div className="flex items-center gap-3">
              <span className="relative flex size-9 items-center justify-center rounded-full bg-gold-500 text-navy-900">
                <MessageSquare className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {knowledge.company.name} Assistant
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-navy-300">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Answers from our project data
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex size-9 items-center justify-center rounded-full text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          {/* Transcript */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-navy-50 p-4"
          >
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <p className="ml-auto w-fit max-w-[85%] rounded-sm bg-navy-900 px-3.5 py-2.5 text-sm text-white">
                    {message.reply.text}
                  </p>
                ) : (
                  <div className="max-w-[92%]">
                    <p className="w-fit rounded-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-navy-800 shadow-card">
                      {message.reply.text}
                    </p>

                    {/* Project cards */}
                    {message.reply.projects?.length ? (
                      <ul className="mt-2 space-y-2">
                        {message.reply.projects.map((project) => (
                          <li key={project.slug}>
                            <Link
                              href={`/projects/${project.slug}`}
                              onClick={() => setOpen(false)}
                              className="group flex items-center justify-between gap-3 rounded-sm border border-border bg-white p-3 transition-colors hover:border-gold-500"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-navy-900">
                                  {project.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {project.priceLabel} · {project.location}
                                </span>
                              </span>
                              <ArrowRight
                                className="size-4 shrink-0 text-gold-600 transition-transform group-hover:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {/* Actions */}
                    {message.reply.actions?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.reply.actions.map((action) =>
                          action.external ? (
                            <a
                              key={action.label}
                              href={action.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-sm bg-navy-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-800"
                            >
                              {action.label}
                            </a>
                          ) : (
                            <Link
                              key={action.label}
                              href={action.href}
                              onClick={() => setOpen(false)}
                              className="rounded-sm bg-navy-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-800"
                            >
                              {action.label}
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}

                    {/* Follow-up prompts */}
                    {message.reply.suggestions?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.reply.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => send(suggestion)}
                            className="rounded-full border border-navy-900/15 bg-white px-3 py-1.5 text-xs text-navy-700 transition-colors hover:border-gold-500 hover:text-navy-900"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-white p-3"
          >
            <label htmlFor="chatbot-input" className="sr-only">
              Ask the assistant a question
            </label>
            <input
              id="chatbot-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a project, price or location…"
              className="h-11 min-w-0 flex-1 rounded-sm border border-border px-3 text-sm text-navy-900 placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-gold-500 text-navy-900 transition-colors hover:bg-gold-400"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>

          {/* Human escalation — always one tap away. */}
          <div className="flex items-center gap-2 border-t border-border bg-navy-50 p-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-navy-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-navy-800"
            >
              <WhatsAppIcon className="size-3.5" />
              WhatsApp
            </a>
            <a
              href={`tel:${knowledge.company.phone.replace(/\s/g, "")}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-white px-3 py-2 text-xs font-medium text-navy-800 transition-colors hover:border-navy-900/40"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              Call
            </a>
          </div>
        </div>
      ) : null}

      {/* --- Launcher ------------------------------------------------------ */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full shadow-luxe-lg transition-all duration-300",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
          open ? "bg-navy-800 text-white" : "bg-navy-900 text-gold-500 hover:bg-navy-800",
        )}
      >
        {open ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <>
            <MessageSquare className="size-6" aria-hidden="true" />
            <span className="absolute top-1 right-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
