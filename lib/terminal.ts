import { Terminal } from "xterm";

export const erase = (term: Terminal, length: number = 1) => {
  for (let i = 0; i < length; i++) {
    term.write("\b \b");
  }
};
