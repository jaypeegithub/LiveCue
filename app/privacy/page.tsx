import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — LiveCue",
  description: "LiveCue privacy policy: what data we collect and how it is used.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 md:p-10 max-w-3xl mx-auto">
      <header className="mb-8">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white text-sm mb-2 inline-block"
        >
          ← LiveCue
        </Link>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-zinc-400 text-sm">Last updated: February 2025</p>
      </header>

      <main className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 text-sm md:text-base">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            What data we collect
          </h2>
          <p>
            LiveCue collects only the information needed to provide fight
            notifications:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong className="text-white">Phone number</strong> — when you
              subscribe to be notified about a specific UFC fight
            </li>
            <li>
              <strong className="text-white">Fight selection</strong> — which
              fight you chose to get a notification for
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            How we use your data
          </h2>
          <p>
            We use your phone number and fight selection solely to send you one
            (1) SMS when the fight <em>before</em> your chosen fight has ended,
            so you know your fight is next. We do not use your data for any
            other purpose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Third parties and marketing
          </h2>
          <p>
            We do <strong className="text-white">not</strong> share your
            information with third parties. We do <strong className="text-white">
              not
            </strong>{" "}
            use your information for marketing purposes. Your phone number and
            subscription details are used only to deliver the notification
            service you requested.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Data storage and security
          </h2>
          <p>
            Subscription data (phone number and fight ID) is stored in a secure
            database. We use industry-standard practices to protect your data.
            You can stop receiving messages at any time (see our{" "}
            <Link href="/terms" className="text-red-400 hover:text-red-300">
              Terms and Conditions
            </Link>{" "}
            for opt-out instructions).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
          <p>
            For privacy-related questions, contact us at{" "}
            <a
              href="mailto:support@livecue.app"
              className="text-red-400 hover:text-red-300"
            >
              support@livecue.app
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-zinc-700 text-zinc-500 text-xs">
        <Link href="/" className="hover:text-white">
          LiveCue
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-white">
          Terms and Conditions
        </Link>
      </footer>
    </div>
  );
}
