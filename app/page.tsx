import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>LiveCue MVP</h1>
      <p>
        <Link href="/api/espn">/api/espn</Link> — returns true if ESPN MMA
        website exists.
      </p>
      <p>
        <Link href="/event">Strickland vs Hernandez</Link> — main card fights for UFC Fight Night.
      </p>
    </div>
  );
}
