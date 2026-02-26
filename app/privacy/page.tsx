import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — LiveCue",
  description: "LiveCue privacy policy: what data we collect and how it is used.",
};

export default function PrivacyPage() {
  return (
    <div className="livecue-page">
      <Link href="/" className="livecue-back">
        ← LiveCue
      </Link>
      <h1>Privacy Policy</h1>
      <p className="livecue-page-meta">Last updated: February 2026</p>

      <section>
        <h2>What we collect</h2>
        <p>
          LiveCue collects only what we need to provide fight alerts: your{" "}
          <strong>phone number</strong> and <strong>fight selection</strong> when
          you subscribe to be notified about a specific bout. If you use the
          site without subscribing, we may receive standard technical data (e.g.
          IP address) from your browser.
        </p>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          We use your phone number and fight choice solely to send you a cue
          when the fight before your chosen fight has ended, so you know yours
          is next. We do not use your data for any other purpose.
        </p>
      </section>

      <section>
        <h2>Third parties and marketing</h2>
        <p>
          We do <strong>not</strong> share your information with third parties.
          We do <strong>not</strong> use your information for marketing. Your
          phone number and subscription details are used only to deliver the
          notification you requested.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use <strong>local storage</strong> in your browser to keep you
          logged in (session data). We do not use cookies for tracking or
          advertising. If you log out or use a different device or browser, you
          will need to log in again. You can clear local storage in your
          browser settings at any time.
        </p>
      </section>

      <section>
        <h2>Data storage and security</h2>
        <p>
          Subscription data is stored in a secure database. We use
          industry-standard practices to protect your data. You can stop
          receiving messages at any time (see our{" "}
          <Link href="/terms">Terms and Conditions</Link> for opt-out
          instructions).
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:livecuesports@gmail.com">livecuesports@gmail.com</a>.
        </p>
      </section>

      <footer className="livecue-footer" style={{ marginTop: "2rem" }}>
        <Link href="/">LiveCue</Link>
        <span>·</span>
        <Link href="/faq">FAQ</Link>
        <span>·</span>
        <Link href="/terms">Terms and Conditions</Link>
      </footer>
    </div>
  );
}
