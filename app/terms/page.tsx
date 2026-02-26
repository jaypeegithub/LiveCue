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
          cue when the fight <em>before</em> your chosen UFC bout has ended,
          so you know your fight is about to start. You sign up with your
          mobile number, select an event and a fight, and choose how you want
          to be alerted: <strong>SMS</strong> or <strong>phone call</strong>.
          You will receive one alert per subscription when your fight is about
          to start.
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
          After you sign up and select a fight to get notified for, we send you
          an <strong>SMS</strong> to verify your phone number and complete
          opt-in. We send this verification text whether you chose SMS or phone
          call for your actual fight alert—it confirms your number is real and
          that you consent to receive notifications.
        </p>
        <p>
          You must reply with the keyword <strong>FIGHT</strong> to opt in and
          verify your phone. You will not receive any fight alerts until you
          have replied <strong>FIGHT</strong>. Once verified, you will receive
          your alert by the method you selected (SMS or phone call) when your
          fight is about to start.
        </p>
      </section>

      <section>
        <h2>Message frequency</h2>
        <p>
          You will receive at most <strong>one (1)</strong> verification SMS
          (to opt in by replying FIGHT) and <strong>one (1)</strong> alert per
          subscription—when the fight before your selected fight has ended. The
          alert is delivered by SMS or phone call based on your choice. We do
          not send recurring or marketing messages.
        </p>
      </section>

      <section>
        <h2>Support contact</h2>
        <p>
          For help or questions, contact us at{" "}
          <a href="mailto:livecuesports@gmail.com">livecuesports@gmail.com</a>.
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
