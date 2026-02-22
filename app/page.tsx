import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
        LiveCue
      </h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">
        Get a text when the fight before your pick is over — so you know yours
        is next.
      </p>
      <Link
        href="/ufc"
        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 font-medium"
      >
        UFC — Today&apos;s card
      </Link>
      <footer className="mt-12 pt-6 border-t border-zinc-700 text-zinc-500 text-xs">
        <Link href="/privacy" className="hover:text-white mr-4">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-white">
          Terms and Conditions
        </Link>
      </footer>
    </div>
  );
}
