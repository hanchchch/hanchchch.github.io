import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { TermCommand } from "../lib/interfaces";

interface TerminalProps {
  title?: string;
  commands?: { [command: string]: TermCommand };
  prefix?: string;
  shell?: string;
}

export function Terminal({
  title = "",
  commands = {},
  prefix = "  ~   main ❯",
}: TerminalProps) {
  const terminal = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<XTerm>();
  const [line, setLine] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [greeted, setGreeted] = useState<boolean>(false);

  const handleCommand = useCallback(
    (command: string) => {
      if (!term) {
        return;
      }
      term.write(`\n`);
      const strippedCommand = command.slice(0, -1);
      const args = strippedCommand.split(" ");
      if (args[0] in commands) {
        commands[args[0]](args, term);
      } else {
        term.write(`command not found: ${args[0]}`);
      }
      term.write(`\n`);
      term.write(`\n`);
      setLine("");
    },
    [term, commands]
  );

  useEffect(() => {
    if (term || !terminal.current) {
      return;
    }
    setTerm(new XTerm({ cursorBlink: true, convertEol: true }));
  }, [terminal, term]);

  useEffect(() => {
    if (!term || !terminal.current) {
      return;
    }
    term.onData((data: string) => {
      const char = data.charCodeAt(0);
      if (char === 0x7f) {
        setLine((line) => line.slice(0, -1));
      } else if (char > 0xff) {
        return;
      } else {
        setLine((line) => line + data);
      }
    });
    term.open(terminal.current);
    setOpened(true);
  }, [terminal, term]);

  useEffect(() => {
    if (!term || !opened) {
      return;
    }
    if (greeted) {
      return;
    }
    term.write(`${title}\n`);
    setGreeted(true);
  }, [term, opened, title, greeted]);

  useEffect(() => {
    if (!term || !greeted) {
      return;
    }
    if (line.charCodeAt(line.length - 1) === 0x0d) {
      handleCommand(line);
    } else {
      term.write(`\r${prefix} ${line} \b`);
    }
  }, [term, line, handleCommand, greeted, prefix]);

  return (
    <>
      <div ref={terminal} />
    </>
  );
}
