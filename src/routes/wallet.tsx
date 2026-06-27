import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/wallet")({
  component: WalletRedirect,
});

function WalletRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/portfolio", replace: true });
  }, [navigate]);

  return null;
}
