export const terminalCommands = [
  "help",
  "whoami",
  "skills",
  "projects",
  "experience",
  "achievements",
  "logs",
  "contact",
  "clear",
] as const;

export type TerminalCommand = (typeof terminalCommands)[number];

export type TerminalEntry = {
  label: string;
  detail?: string;
  href?: string;
};

export type TerminalResponse = {
  heading?: string;
  lines?: readonly string[];
  entries?: readonly TerminalEntry[];
  action?: TerminalEntry;
  announcement: string;
};

export type TerminalContent = {
  prompt: string;
  submitLabel: string;
  keyboardHint: string;
  ready: string;
  consoleLabel: string;
  instruction: string;
  inputLabel: string;
  outputLabel: string;
  commandDescriptions: Record<TerminalCommand, string>;
  responses: Record<Exclude<TerminalCommand, "help" | "clear">, TerminalResponse>;
  availableHeading: string;
  invalidPrefix: string;
  invalidHint: string;
  clearedAnnouncement: string;
};
