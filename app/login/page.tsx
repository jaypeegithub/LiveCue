import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Log in — LiveCue",
  description: "Log in to your LiveCue account.",
};

export default function LoginPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>Log in</h1>
      <Suspense fallback={<p className="livecue-desc">Loading...</p>}>
        <LoginForm />
      </Suspense>
      <p style={{ marginTop: "1rem" }}>
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}
