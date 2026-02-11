import { type ReactNode } from "react";

/**
 * Safely render a prompt string with **bold** markdown syntax
 * as React elements, without using dangerouslySetInnerHTML.
 */
export function renderBoldPrompt(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-primary font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
