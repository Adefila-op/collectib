import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Send } from "lucide-react";

export const Route = createFileRoute("/messages")({
  component: Messages,
});

function Messages() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar title="Emma Reyes" />
      <div className="text-center text-xs text-muted-foreground -mt-2">Active now</div>
      <div className="flex-1 px-5 pt-6 space-y-3 overflow-y-auto">
        <Bubble me={false}>Hi Tima! Thank you for your interest in my work.</Bubble>
        <Bubble me={true}>Hi! I'd love to know if "Ethereal Flow" is still available?</Bubble>
        <Bubble me={false}>Yes, it is! Would you like to make an offer?</Bubble>
        <Bubble me={true}>Yes, I'd like to offer $4,000.</Bubble>
      </div>
      <div className="p-4 border-t border-border flex items-center gap-2">
        <input
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-secondary px-4 py-3 outline-none text-sm"
        />
        <button className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function Bubble({ children, me }: { children: React.ReactNode; me: boolean }) {
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${me ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}
      >
        {children}
      </div>
    </div>
  );
}
