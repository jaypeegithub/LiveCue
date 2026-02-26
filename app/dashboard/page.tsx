import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>Dashboard</h1>
      <p>You&apos;re logged in. Manage your fight alerts here.</p>
    </div>
  );
}
