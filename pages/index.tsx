import { useState } from "react";
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
    { perm: "rwxr-xr-x", name: ".", directory: true },
    { perm: "rwxr-xr-x", name: "..", directory: true },
    contact,
    educations,
    experiences,
  ]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Terminal
        prefix={
          " hanch \x1b[1;34m ~\x1b[0m \x1b[1;32m  main\x1b[0m \x1b[0;32m❯\x1b[0m"
        }
        initializer={async (term) => {
          term.focus();
          term.resize(120, 40);
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
      />
    </div>
  );
}
