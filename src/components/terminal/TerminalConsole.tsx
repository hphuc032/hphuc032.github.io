"use client";

import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { terminalCommands, type TerminalCommand, type TerminalContent, type TerminalResponse } from "./types";

const MAX_HISTORY = 50;
type HistoryRecord = { id: number; command: string; response: TerminalResponse };

function Response({ response }: { response: TerminalResponse }) {
  return <div className="terminal-response">
    {response.heading && <p className="terminal-response-heading">{response.heading}</p>}
    {response.lines?.map(line => <p key={line}>{line}</p>)}
    {!!response.entries?.length && <ul>{response.entries.map(entry => <li key={`${entry.label}-${entry.detail ?? ""}`}>
      {entry.href ? <DeploymentLink href={entry.href} prefetch={false}>{entry.label}<span aria-hidden="true"> ↗</span></DeploymentLink> : <strong>{entry.label}</strong>}
      {entry.detail && <span>{entry.detail}</span>}
    </li>)}</ul>}
    {response.action && <DeploymentLink className="terminal-action" href={response.action.href!} prefetch={false}>{response.action.label}<span aria-hidden="true"> →</span></DeploymentLink>}
  </div>;
}

export function TerminalConsole({ content }: { content: TerminalContent }) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [announcement, setAnnouncement] = useState({ text: "", revision: 0 });
  const draft = useRef("");
  const nextId = useRef(0);
  const output = useRef<HTMLDivElement>(null);

  const helpResponse = useMemo<TerminalResponse>(() => ({
    heading: content.availableHeading,
    entries: terminalCommands.map(command => ({ label: command, detail: content.commandDescriptions[command] })),
    announcement: `${terminalCommands.length} ${content.availableHeading.toLocaleLowerCase()}`,
  }), [content]);

  useEffect(() => {
    const region = output.current;
    if (region) region.scrollTop = region.scrollHeight;
  }, [history]);

  function announce(text: string) {
    setAnnouncement(previous => ({ text, revision: previous.revision + 1 }));
  }

  function clear() {
    setHistory([]);
    setCommandHistory([]);
    setHistoryCursor(0);
    draft.current = "";
    setValue("");
    announce(content.clearedAnnouncement);
  }

  function execute(raw: string) {
    const commandText = raw.slice(0, 64).trim();
    if (!commandText) return;
    const normalized = commandText.toLocaleLowerCase("en-US");
    if (normalized === "clear") {
      clear();
      return;
    }
    const isCommand = terminalCommands.includes(normalized as TerminalCommand);
    const response = normalized === "help"
      ? helpResponse
      : isCommand
        ? content.responses[normalized as keyof typeof content.responses]
        : {
            lines: [`${content.invalidPrefix}: ${commandText}`, content.invalidHint],
            announcement: `${content.invalidPrefix}: ${commandText}`,
          };
    setHistory(records => [...records, { id: nextId.current++, command: commandText, response }].slice(-MAX_HISTORY));
    setCommandHistory(commands => [...commands, commandText].slice(-MAX_HISTORY));
    setHistoryCursor(Math.min(commandHistory.length + 1, MAX_HISTORY));
    draft.current = "";
    announce(response.announcement);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    execute(value);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLocaleLowerCase() === "l") {
      event.preventDefault();
      clear();
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    if (!commandHistory.length) return;
    if (event.key === "ArrowUp") {
      if (historyCursor === commandHistory.length) draft.current = value;
      const next = Math.max(0, historyCursor - 1);
      setHistoryCursor(next);
      setValue(commandHistory[next] ?? "");
      return;
    }
    if (historyCursor === commandHistory.length) return;
    const next = Math.min(commandHistory.length, historyCursor + 1);
    setHistoryCursor(next);
    setValue(next === commandHistory.length ? draft.current : (commandHistory[next] ?? ""));
  }

  return <div className="terminal-console" data-native-cursor>
    <div className="terminal-console-bar"><span>{content.consoleLabel}</span><span>{content.ready}</span></div>
    <div ref={output} className="terminal-output" role="log" aria-live="off" tabIndex={0} aria-label={content.outputLabel}>
      <div className="terminal-welcome"><p>{content.ready}</p><p>{content.instruction}</p></div>
      <ol>{history.map(record => <li key={record.id}>
        <p className="terminal-command"><span>{content.prompt}</span> {record.command}</p>
        <Response response={record.response} />
      </li>)}</ol>
    </div>
    <form className="terminal-form" onSubmit={submit}>
      <label className="sr-only" htmlFor="terminal-command">{content.inputLabel}</label>
      <span aria-hidden="true">{content.prompt}</span>
      <input id="terminal-command" name="command" value={value} onChange={event => setValue(event.target.value.slice(0, 64))} onKeyDown={handleKeyDown}
        aria-describedby="terminal-keyboard-hint" autoComplete="off" autoCapitalize="none" autoCorrect="off" enterKeyHint="send" maxLength={64} spellCheck={false} />
      <button type="submit">{content.submitLabel}<span aria-hidden="true"> ↵</span></button>
    </form>
    <p id="terminal-keyboard-hint" className="terminal-keyboard-hint">{content.keyboardHint}</p>
    <p className="sr-only" aria-live="polite" aria-atomic="true"><span key={announcement.revision}>{announcement.text}</span></p>
  </div>;
}
