import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { SecondaryButton } from "@/components/art-ui";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { loginWithEmail, saveSession, signUpWithEmail } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    try {
      const result = isLogin
        ? await loginWithEmail({ email, password })
        : await signUpWithEmail({ fullName, email, password });

      saveSession(result.token, result.profile.wallet_address);
      navigate({ to: isLogin ? "/home" : "/onboarding/wallet" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      <TopBar to="/" />
      <div className="px-6 pt-2 pb-10">
        <h1 className="text-4xl font-extrabold leading-tight">
          {isLogin ? "Welcome" : "Create"}
          <br />
          {isLogin ? "back" : "Account"}
        </h1>

        <form className="mt-8" onSubmit={handleSubmit}>
          <div className="space-y-3">
            {!isLogin && (
              <Field
                label="Full name"
                placeholder="Tima Bouzid"
                value={fullName}
                onChange={setFullName}
                icon={<User size={16} />}
                autoComplete="name"
                required
              />
            )}
            <Field
              label="Email address"
              placeholder="tima@gmail.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              icon={<Lock size={16} />}
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={8}
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-xs text-primary font-medium">
              Forgot password?
            </Link>
          </div>

          {status && (
            <p className="mt-4 text-xs text-center text-destructive" role="alert">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <SecondaryButton to="/onboarding/wallet">
          {isLogin ? "Log in with wallet" : "Continue with wallet"}
        </SecondaryButton>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setStatus("");
            }}
            className="text-primary font-semibold"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  action,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <label className="text-[11px] text-muted-foreground font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full min-w-0 bg-transparent outline-none text-sm font-medium placeholder:text-foreground/60"
        />
        {action}
      </div>
    </div>
  );
}
