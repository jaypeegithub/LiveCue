import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — LiveCue",
  description:
    "LiveCue terms and conditions, message rates, frequency, and opt-out instructions.",
};

export default function TermsPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>Terms and Conditions</h1>
      <p className="livecue-page-meta">Last updated: February 2025</p>

      <section>
        <h2>Program name and description</h2>
        <p>
          <strong>LiveCue</strong> is a notification service that sends you a
          cue (e.g. by SMS) when the fight <em>before</em> your chosen UFC bout
          has ended, so you know your fight is about to start. You select an
          event and a fight and may provide your mobile number to receive
          reminders.
        </p>
      </section>

      <section>
        <h2>Message and data rates</h2>
        <p>
          Message and data rates may apply. Standard carrier rates for SMS may
          apply depending on your wireless plan. LiveCue does not charge you for
          the alerts; any costs are from your mobile carrier.
        </p>
      </section>

      <section>
        <h2>Opt-in and phone verification</h2>
        <p>
          When you sign up with your phone number to receive a notification,
          you will receive a text message asking you to opt in and verify your
          phone number. You must reply with the opt-in keyword{" "}
          <strong>SUBSCRIBE</strong> to verify your identity and complete
          opt-in. You will not receive fight alerts until you have replied with{" "}
          <strong>SUBSCRIBE</strong>.
        </p>
      </section>

      <section>
        <h2>Message frequency</h2>
        <p>
          You will receive at most <strong>one (1)</strong> text per
          subscription—when the fight before your selected fight has ended. We
          do not send recurring or marketing messages.
        </p>
      </section>

      <section>
        <h2>Support contact</h2>
        <p>
          For help or questions, contact us at{" "}
          <a href="mailto:support@livecue.app">support@livecue.app</a>.
        </p>
      </section>

      <section>
        <h2>Opt-out instructions</h2>
        <p>You can stop receiving messages at any time:</p>
        <ul>
          <li>
            <strong>HELP</strong> — Text <strong>HELP</strong> to the number that
            sent you the LiveCue message to get support contact information.
          </li>
          <li>
            <strong>STOP</strong> — Text <strong>STOP</strong> to the number
            that sent you the LiveCue message to opt out. You will receive a
            confirmation that you have been unsubscribed.
          </li>
        </ul>
        <p>
          Because LiveCue sends only one notification per subscription, you may
          not receive further messages after that alert. If you subscribe again
          later, you can use <strong>STOP</strong> at any time to opt out.
        </p>
      </section>

      <section>
        <h2>Use of the service</h2>
        <p>
          You agree to use LiveCue only for lawful purposes and in line with
          these terms. We may change or discontinue the service with notice
          where required. Your continued use after changes means you accept the
          updated terms.
        </p>
      </section>

      <footer className="livecue-footer" style={{ marginTop: "2rem" }}>
        <Link href="/">LiveCue</Link>
        <span>·</span>
        <Link href="/privacy">Privacy Policy</Link>
      </footer>
    </div>
  );
}
