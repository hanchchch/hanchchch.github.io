import { TermCommand, TermFile } from "./interfaces";

const toLsDate = (date: Date) => {
  const m = date.toLocaleString("default", { month: "short" });
  const d = `${date.getDate()}`.padStart(2, "0");
  const h = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  return `${m} ${d} ${h}:${min}`;
};

export const createCommandLs: (files: TermFile[]) => TermCommand =
  (files) => (args, term) => {
    const l = args.slice(1).some((arg) => arg.includes("l"));
    const a = args.slice(1).some((arg) => arg.includes("a"));
    const filesToDisplay = a
      ? files
      : files.filter((file) => !file.name.startsWith("."));
    filesToDisplay.sort((a, b) => (a.name > b.name ? 1 : -1));
    const mapper = l
      ? (file: TermFile) =>
          `${file.directory ? "d" : "-"}${file.perm}   19 hanch  hanch ${String(
            file.directory ? 608 : file.content?.length || 0
          ).padStart(7, " ")} ${toLsDate(file.date)} ${file.name}`
      : (file: TermFile) => file.name;
    term.write(filesToDisplay.map(mapper).join("\n"));
    return 0;
  };

export const createCommandCat: (files: TermFile[]) => TermCommand =
  (files) => (args, term) => {
    const file = files.find((file) => file.name === args[1]);
    if (!file || file.directory) {
      term.write(`cat: ${args[1]}: No such file or directory`);
      return 1;
    }
    term.clear();
    term.write(file.content || "");
    term.scrollToTop();
    return 0;
  };
