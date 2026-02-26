import Link from "next/link";

export const metadata = {
  title: "FAQ — LiveCue",
  description: "Frequently asked questions about LiveCue fight alerts and notifications.",
};

export default function FAQPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>FAQ</h1>
      <p className="livecue-page-meta">Frequently asked questions</p>

      <section>
        <h2>What is LiveCue?</h2>
        <p>
          LiveCue is a notification service for UFC fans. You pick an upcoming
          event and the fight you care about. We send you one alert—by SMS or
          phone call—when the fight <em>before</em> yours has ended, so you know
          your fight is about to start and don’t miss it.
        </p>
      </section>

      <section>
        <h2>How do I get started?</h2>
        <p>
          Create an account with your phone number (US or Canada), then log in
          and go to your dashboard. Select an event, pick a fight, choose whether
          you want an <strong>SMS</strong> or <strong>phone call</strong> for
          the alert, and click “Alert me when this fight is about to start!”
          You’ll get a verification text—reply <strong>FIGHT</strong> to opt in.
          After that, we’ll send your one alert when your fight is up next.
        </p>
      </section>

      <section>
        <h2>Why do I have to reply FIGHT?</h2>
        <p>
          We send you a verification SMS after you set up an alert. Replying{" "}
          <strong>FIGHT</strong> confirms your phone number is real and that you
          consent to receive the notification. You won’t get any fight alerts
          until you’ve replied FIGHT. This keeps the service compliant and
          ensures we’re only messaging people who opted in.
        </p>
      </section>

      <section>
        <h2>Will I get SMS or a phone call?</h2>
        <p>
          You choose when you set up the alert. You can pick <strong>SMS</strong>{" "}
          (text message) or <strong>phone call</strong>. The verification
          message is always an SMS (so we can verify your number); the actual
          “your fight is about to start” alert is delivered the way you
          selected.
        </p>
      </section>

      <section>
        <h2>How many messages will I get?</h2>
        <p>
          One verification SMS (reply FIGHT to opt in) and one alert per
          subscription—when the fight before yours has ended. We don’t send
          recurring or marketing messages.
        </p>
      </section>

      <section>
        <h2>Do I get charged?</h2>
        <p>
          LiveCue doesn’t charge you. Message and data rates may apply from your
          mobile carrier depending on your plan. Check your carrier for SMS and
          voice rates.
        </p>
      </section>

      <section>
        <h2>How do I stop getting messages?</h2>
        <p>
          Text <strong>STOP</strong> to the number that sent you the LiveCue
          message to opt out. You’ll get a confirmation. For help, text{" "}
          <strong>HELP</strong> or contact us at{" "}
          <a href="mailto:livecuesports@gmail.com">livecuesports@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Which countries are supported?</h2>
        <p>
          Right now we support phone numbers in the <strong>United States</strong> and{" "}
          <strong>Canada</strong>. You select your country when you sign up so
          your number is in the right format.
        </p>
      </section>

      <footer className="livecue-footer" style={{ marginTop: "2rem" }}>
        <Link href="/">LiveCue</Link>
        <span>·</span>
        <Link href="/privacy">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms">Terms and Conditions</Link>
      </footer>
    </div>
  );
}
