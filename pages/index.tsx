import { useState } from "react";
import dynamic from "next/dynamic";
import { TermFile } from "../lib/interfaces";
import { createCommandLs } from "../lib/commands";

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
    { perm: "r--r--r--", name: "about.md", directory: false },
    { perm: "r--r--r--", name: "contact.md", directory: false },
  ]);

  return (
    <>
      <Terminal
        title={title}
        commands={{
          help: (args, term) => {
            term.write(`Available commands:\n\n  - help\n  - clear\n  - echo`);
            return 0;
          },
          clear: (args, term) => {
            term.clear();
            return 0;
          },
          ls: createCommandLs(files),
        }}
      />
    </>
  );
}
