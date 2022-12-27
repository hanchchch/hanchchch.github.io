import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { TermCommand } from "../lib/interfaces";

const fontSize = 9;

interface TerminalProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  autoComplete?: (line: string, term: XTerm) => string;
  initializer?: (term: XTerm) => Promise<void>;
  onCommand?: (line: string, term: XTerm) => void;
  upperHistory?: () => string;
  lowerHistory?: () => string;
  commands?: { [command: string]: TermCommand };
  prefix?: string;
}

export function Terminal({
  width,
  height,
  autoComplete,
  initializer = () => Promise.resolve(),
  onCommand = () => {},
  upperHistory = () => "",
  lowerHistory = () => "",
  commands = {},
  prefix = " \x1b[1;34m  ~\x1b[0m \x1b[1;32m  main\x1b[0m \x1b[0;32m❯\x1b[0m",
}: TerminalProps) {
  const terminal = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<XTerm>();
  const [line, setLine] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  const handleCommand = useCallback(
    async (command: string) => {
      if (!term) {
        return;
      }
      term.writeln("");
      const strippedCommand = command.slice(0, -1);
      onCommand(strippedCommand, term);

      const args = strippedCommand.split(" ");
      if (args[0] in commands) {
        setProcessing(true);
        await commands[args[0]](args, term);
        setProcessing(false);
      } else if (args[0] === "") {
        // do nothing
      } else {
        term.write(`command not found: ${args[0]}`);
      }
      term.writeln("");
      term.writeln("");
      setLine("");
    },
    [term, commands, onCommand]
  );

  const reset = useCallback(() => {
    if (!term) {
      return;
    }
    term.dispose();
    setProcessing(false);
    setInitialized(false);
    setOpened(false);
    setLine("");
    setTerm(undefined);
  }, [term]);

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
    term.resize(
      Math.floor(terminal.current.clientWidth / fontSize),
      Math.floor(terminal.current.clientHeight / (fontSize * 2))
    );
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
    if (!term) {
      return;
    }
    term.attachCustomKeyEventHandler((e) => {
      if (e.type === "keyup") {
        return true;
      }
      if (e.ctrlKey && e.key === "d") {
        reset();
        return false;
      }
      if (e.key === "ArrowUp") {
        setLine(upperHistory());
        return false;
      } else if (e.key === "ArrowDown") {
        setLine(lowerHistory());
        return false;
      } else if (e.key === "ArrowRight") {
        return false;
      } else if (e.key === "ArrowLeft") {
        return false;
      }
      return true;
    });
  }, [term, upperHistory, lowerHistory, reset]);

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
    if (!term || !initialized || processing) {
      return;
    }
    const lastChar = line.charCodeAt(line.length - 1);
    if (lastChar === 0x0d) {
      handleCommand(line);
      return;
    } else if (lastChar === 0x09) {
      if (autoComplete) {
        setLine(autoComplete(line.slice(0, line.length - 1), term));
      }
      return;
    }
    term.write(`\x1b[2K\r${prefix} `);
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
  }, [
    term,
    line,
    handleCommand,
    initialized,
    prefix,
    commands,
    autoComplete,
    processing,
  ]);

  return <div ref={terminal} style={{ width, height }} />;
}
