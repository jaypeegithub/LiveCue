import Link from "next/link";
import SignupForm from "@/components/SignupForm";

export const metadata = {
  title: "Sign up — LiveCue",
  description: "Create your LiveCue account.",
};

export default function SignupPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>Sign up</h1>
      <SignupForm />
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
