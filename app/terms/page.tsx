import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — LiveCue",
  description:
    "LiveCue terms and conditions, message rates, frequency, and opt-out instructions.",
};

export default function TermsPage() {
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
          Terms and Conditions
        </h1>
        <p className="mt-2 text-zinc-400 text-sm">Last updated: February 2025</p>
      </header>

      <main className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 text-sm md:text-base">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Program name and description
          </h2>
          <p>
            <strong className="text-white">LiveCue</strong> is a notification
            service that sends you one (1) SMS when the fight <em>before</em>{" "}
            your chosen UFC fight has ended, so you know your fight is about to
            start. You select a fight and provide your mobile number to receive
            a single reminder text.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Message and data rates
          </h2>
          <p>
            Message and data rates may apply. Standard carrier rates for SMS may
            apply depending on your wireless plan. LiveCue does not charge you
            for the service; any costs are from your mobile carrier.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Message frequency
          </h2>
          <p>
            You will receive at most <strong className="text-white">one (1)</strong>{" "}
            text per subscription — when the fight before your selected fight
            has ended. We do not send recurring or marketing messages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Support contact
          </h2>
          <p>
            For help or questions about LiveCue, contact us at{" "}
            <a
              href="mailto:support@livecue.app"
              className="text-red-400 hover:text-red-300"
            >
              support@livecue.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Opt-out instructions
          </h2>
          <p className="mb-3">
            You can stop receiving messages at any time:
          </p>
          <ul className="list-none space-y-2">
            <li>
              <strong className="text-white">HELP</strong> — Text{" "}
              <strong className="text-white">HELP</strong> to the number that
              sent you the LiveCue message to get support contact information.
            </li>
            <li>
              <strong className="text-white">STOP</strong> — Text{" "}
              <strong className="text-white">STOP</strong> to the number that
              sent you the LiveCue message to opt out and stop receiving
              messages. You will receive a confirmation that you have been
              unsubscribed.
            </li>
          </ul>
          <p className="mt-3">
            Because LiveCue sends only one notification per subscription, you
            may not receive further messages after that single alert. If you
            subscribe again in the future, you can use{" "}
            <strong className="text-white">STOP</strong> at any time to opt out.
          </p>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-zinc-700 text-zinc-500 text-xs">
        <Link href="/" className="hover:text-white">
          LiveCue
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:text-white">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
