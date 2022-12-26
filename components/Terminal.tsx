import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { TermCommand } from "../lib/interfaces";

interface TerminalProps {
  initializer?: (term: XTerm) => Promise<void>;
  commands?: { [command: string]: TermCommand };
  prefix?: string;
}

export function Terminal({
  initializer = () => Promise.resolve(),
  commands = {},
  prefix = " \x1b[1;34m  ~\x1b[0m \x1b[1;32m  main\x1b[0m \x1b[0;32m❯\x1b[0m",
}: TerminalProps) {
  const terminal = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<XTerm>();
  const [line, setLine] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

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
    setTerm(new XTerm({ cursorBlink: true, convertEol: true, theme: {} }));
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
    if (initialized) {
      return;
    }
    initializer(term).then(() => setInitialized(true));
  }, [term, opened, initializer, initialized]);

  useEffect(() => {
    if (!term || !initialized) {
      return;
    }
    if (line.charCodeAt(line.length - 1) === 0x0d) {
      handleCommand(line);
      return;
    }
    term.write(`\r${prefix} `);
    if (commands.hasOwnProperty(line.split(" ")[0])) {
      term.write(
        line.replace(
          line.split(" ")[0],
          `\x1b[1;32m${line.split(" ")[0]}\x1b[0m`
        )
      );
    } else {
      term.write(line);
    }
    term.write(` \b`);
  }, [term, line, handleCommand, initialized, prefix, commands]);

  return (
    <>
      <div ref={terminal} />
    </>
  );
}
