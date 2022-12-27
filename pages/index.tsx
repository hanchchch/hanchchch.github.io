import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TermFile } from "../lib/interfaces";
import { createCommandCat, createCommandLs } from "../lib/commands";
import { sleep } from "../lib/time";
import { erase } from "../lib/terminal";
import { contact, experiences, educations } from "../lib/files";

const Terminal = dynamic(
  () => import("../components/Terminal").then((mod) => mod.Terminal),
  { ssr: false }
);

const title = `
  ██╗  ██╗ █████╗ ███╗   ██╗ ██████╗██╗  ██╗
  ██║  ██║██╔══██╗████╗  ██║██╔════╝██║  ██║
  ███████║███████║██╔██╗ ██║██║     ███████║
  ██╔══██║██╔══██║██║╚██╗██║██║     ██╔══██║
  ██║  ██║██║  ██║██║ ╚████║╚██████╗██║  ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝

  Welcome! See available commands with \`help\`.

`;

export default function Home() {
  const [files, setFiles] = useState<TermFile[]>([
    { perm: "rwxr-xr-x", name: ".", date: new Date(), directory: true },
    { perm: "rwxr-xr-x", name: "..", date: new Date(), directory: true },
    {
      perm: "rw-r--r--",
      name: ".zsh_history",
      date: new Date(),
      directory: false,
      content: "",
    },
    contact,
    educations,
    experiences,
  ]);
  const [currentHistory, setCurrentHistory] = useState<number>(-1);

  const getHistory = useCallback(() => {
    const historyFile = files.find((f) => f.name === ".zsh_history");
    if (!historyFile) {
      throw new Error("History file not found");
    }
    return historyFile;
  }, [files]);

  const setFile = useCallback(
    ({
      name,
      perm,
      content,
    }: {
      name: string;
      perm?: string;
      content?: string;
    }) => {
      setFiles((files) => {
        const file = files.find((f) => f.name === name);
        return [
          ...files.filter((f) => f.name !== name),
          file
            ? {
                ...file,
                perm: perm || file.perm,
                content: content || file.content,
                date: new Date(),
              }
            : {
                name,
                perm: "rw-rw-r--",
                directory: false,
                content: content || "",
                date: new Date(),
              },
        ];
      });
    },
    [setFiles]
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Terminal
        width="100vw"
        height="100vh"
        prefix={
          " hanch \x1b[1;34m ~\x1b[0m \x1b[1;32m  main\x1b[0m \x1b[0;32m❯\x1b[0m"
        }
        onCommand={(command) => {
          setCurrentHistory(-1);
          const old = getHistory().content;
          setFile({
            name: ".zsh_history",
            content: old === "" ? command : `${old}\n${command}`,
          });
        }}
        upperHistory={() => {
          const histories = getHistory().content?.split("\n") || [];
          const nextHistory = currentHistory + 1;
          setCurrentHistory(Math.min(nextHistory, histories.length - 1));
          if (nextHistory <= histories.length - 1) {
            return histories[histories.length - 1 - nextHistory];
          }
          return histories[0];
        }}
        lowerHistory={() => {
          const histories = getHistory().content?.split("\n") || [];
          const nextHistory = currentHistory - 1;
          setCurrentHistory(Math.max(nextHistory, 0));
          if (nextHistory >= 0) {
            return histories[histories.length - 1 - nextHistory];
          }
          return "";
        }}
        initializer={async (term) => {
          term.focus();
          term.write("Loading ");
          for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 3; j++) {
              term.write(".");
              await sleep(300);
            }
            erase(term, 3);
          }
          erase(term, 30);
          term.write(title);
        }}
        commands={{
          help: (args, term) => {
            term.write(
              `Available commands:\n\n  - help\n  - clear\n  - ls\n  - cat`
            );
            return 0;
          },
          clear: (args, term) => {
            term.clear();
            return 0;
          },
          ls: createCommandLs(files),
          cat: createCommandCat(files),
        }}
        autoComplete={(line, term) => {
          if (line.startsWith("cat ")) {
            const matchingfiles = files.filter((f) =>
              f.name.startsWith(line.slice(4))
            );
            if (matchingfiles.length === 1) {
              return `cat ${matchingfiles[0].name}`;
            }
          } else if (line.startsWith("ls ")) {
            const matchingfiles = files.filter(
              (f) => f.directory && f.name.startsWith(line.slice(3))
            );
            if (matchingfiles.length === 1) {
              return `ls ${matchingfiles[0].name}`;
            }
          }
          return line;
        }}
      />
    </div>
  );
}
