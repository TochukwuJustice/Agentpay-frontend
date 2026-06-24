import { messages } from "@/lib/messages";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
      <p>{messages.footer.text}</p>
    </footer>
  );
}

