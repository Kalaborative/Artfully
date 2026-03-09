export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">Last Updated: March 6, 2026</p>

        <p>
          At Artfully, we believe your focus should be on your art, not on who is tracking you. This
          policy explains what information we collect, how we use it, and how we keep it safe.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
        <p>
          We aim to collect as little personal data as possible to get you into the game quickly.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account Data:</strong> If you create an account, we store your username and email
            address. If you play as a guest, we may assign a temporary identifier.
          </li>
          <li>
            <strong>Gameplay Data:</strong> To make the game multiplayer, we transmit your drawing
            coordinates, brush strokes, and chat messages to other players in your room via
            WebSockets.
          </li>
          <li>
            <strong>Technical Data:</strong> Like most web apps, we automatically collect basic info
            such as your IP address, browser type, and device info to help us prevent abuse and fix
            bugs.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">2. How We Use Your Information</h2>
        <p>We use your data strictly to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and maintain the live game environment.</li>
          <li>Save your "Gallery" or high scores (if applicable).</li>
          <li>
            Identify and block "trolls" or users who violate our Terms of Service.
          </li>
          <li>Analyze site traffic to improve performance.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Cookies and Local Storage</h2>
        <p>We use Cookies or Local Storage to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Keep you logged in between sessions.</li>
          <li>
            Remember your game preferences (like your favorite brush color or volume settings).
          </li>
          <li>Prevent "spamming" of our game rooms.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Data Retention</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Drawings:</strong> In-game drawings are generally temporary and exist only for
            the duration of a round, unless you specifically save them to a "Gallery" feature.
          </li>
          <li>
            <strong>Chat Logs:</strong> We may temporarily log chat messages to moderate the
            community, but these are purged periodically.
          </li>
          <li>
            <strong>Accounts:</strong> We keep your account data as long as your account is active.
            You can request a deletion at any time.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Third-Party Services</h2>
        <p>
          We host Artfully on Vercel and may use third-party tools for database management or
          analytics (e.g., Supabase, MongoDB, or Google Analytics). These services have their own
          privacy policies regarding how they handle data on our behalf.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Children's Privacy</h2>
        <p>
          Artfully is not intentionally targeted at children under 13. If we discover we have
          inadvertently collected data from a child under 13 without parental consent, we will delete
          it immediately.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Your Rights</h2>
        <p>
          Depending on where you live (such as the EU with GDPR or California with CCPA), you may
          have the right to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access the data we have about you.</li>
          <li>Request that we delete your data.</li>
          <li>Opt-out of data collection.</li>
        </ul>
        <p>
          To exercise these rights, please contact us at{' '}
          <a href="mailto:magnoliadraeh@gmail.com" className="text-primary-600 hover:text-primary-700 underline">
            magnoliadraeh@gmail.com
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">8. Changes to This Policy</h2>
        <p>
          If we change how we handle your data, we'll update this page. Your continued use of
          Artfully after an update means you've checked in on the new rules.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">Security Note</h2>
        <p>
          While we do our best to protect your data, no method of transmission over the internet is
          100% secure. Please don't share sensitive personal information (like passwords or home
          addresses) in the game's public chat.
        </p>
      </div>
    </div>
  );
}
