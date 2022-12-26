import { TermCommand, TermFile } from "./interfaces";

export const createCommandLs: (files: TermFile[]) => TermCommand =
  (files) => (args, term) => {
    const l = args.slice(1).some((arg) => arg.includes("l"));
    const a = args.slice(1).some((arg) => arg.includes("a"));
    const filesToDisplay = a
      ? files
      : files.filter((file) => !file.name.startsWith("."));
    filesToDisplay.sort();
    const mapper = l
      ? (file: TermFile) =>
          `${file.directory ? "d" : "-"}${
            file.perm
          }   19 hanch  hanch     608 Dec 27 00:04 ${file.name}`
      : (file: TermFile) => file.name;
    term.write(filesToDisplay.map(mapper).join("\n"));
    return 0;
  };
