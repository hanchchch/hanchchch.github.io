import { Terminal } from "xterm";

export type TermCommand = (args: string[], term: Terminal) => number;

export interface TermFile {
  perm: string;
  name: string;
  directory: boolean;
  date: Date;
  content?: string;
}
