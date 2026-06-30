import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User, Users } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import {
  checkAuthRecognition,
  hasKnownAuthDevice,
  loginWithEmail,
  saveSession,
  signUpWithEmail,
} from "@/lib/api";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">(() =>
    hasKnownAuthDevice() ? "login" : "signup",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "non_binary" | "prefer_not_to_say">(
    "prefer_not_to_say",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    if (hasKnownAuthDevice()) {
      setMode("login");
      return;
    }

    let cancelled = false;
    checkAuthRecognition()
      .then(({ recognized }) => {
        if (!cancelled) setMode(recognized ? "login" : "signup");
      })
      .catch(() => {
        if (!cancelled) setMode("signup");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    try {
      const result = isLogin
        ? await loginWithEmail({ email, password })
        : await signUpWithEmail({ fullName, email, password, gender, dashboardType: "collector" });

      if (!result) {
        throw new Error("Authentication returned an empty response. Please try again.");
      }

      if ("needsVerification" in result) {
        navigate({ to: "/verify-email", search: { email } });
        return;
      }

      saveSession(result.token, result.profile.wallet_address);
      if (isLogin && localStorage.getItem("onboarding_completed") === "true") {
        navigate({ to: "/home" });
      } else {
        navigate({ to: "/onboarding/role" });
      }
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
              <>
                <Field
                  label="Full name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={setFullName}
                  icon={<User size={16} />}
                  autoComplete="name"
                  required
                />
                <SelectField
                  label="Gender"
                  value={gender}
                  onChange={(value) => setGender(value as typeof gender)}
                  icon={<Users size={16} />}
                  options={[
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "non_binary", label: "Non-binary" },
                  ]}
                />
              </>
            )}
            <Field
              label="Email address"
              placeholder="you@example.com"
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

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <label className="text-[11px] text-muted-foreground font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 bg-transparent outline-none text-sm font-medium"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
