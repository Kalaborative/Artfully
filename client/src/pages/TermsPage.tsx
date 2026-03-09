export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">Last Updated: March 6, 2026</p>

        <p>
          Welcome to Artfully! By using our platform at artfully.vercel.app, you're agreeing to the
          rules below. If you don't agree, please refrain from using the site (though we'd be sad to
          see you go).
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">1. The Basics</h2>
        <p>Artfully is a live, multiplayer drawing game. To keep things running smoothly:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Eligibility:</strong> You must be at least 13 years old (or the age of majority
            in your country) to use Artfully.
          </li>
          <li>
            <strong>Accountability:</strong> You are responsible for any "masterpieces" (or doodles)
            you create and any interactions you have with other players.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">2. User-Generated Content (UGC)</h2>
        <p>Everything you draw or type on Artfully is User Content.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Ownership:</strong> You own your drawings. However, by playing, you grant
            Artfully a worldwide, royalty-free license to display, host, and stream your content so
            the game actually works.
          </li>
          <li>
            <strong>Content Rules:</strong> You agree not to draw or share anything that is:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Illegal, hateful, or discriminatory.</li>
              <li>Sexually explicit or excessively violent.</li>
              <li>Designed to harass or "troll" other players.</li>
            </ul>
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Community Standards & Conduct</h2>
        <p>To keep Artfully fun for everyone, you agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use bots, scripts, or hacks to gain an unfair advantage.</li>
          <li>Attempt to disrupt the servers or the gameplay of others.</li>
          <li>Impersonate other users or Artfully staff.</li>
        </ul>
        <p>
          <strong>Note:</strong> We reserve the right to kick, ban, or restrict access to any user
          who violates these standards, without prior notice.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Intellectual Property</h2>
        <p>
          While you own your drawings, we own the Artfully brand, the code, the UI/UX, and the
          shiny logo. Please don't scrape our site or copy our code for your own commercial use
          without asking us first.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Disclaimer of Warranties</h2>
        <p>
          Artfully is provided "as is." While we strive for 100% uptime and a bug-free experience,
          we don't guarantee that the service will always be perfect, secure, or available. We aren't
          liable for any lost drawings or connectivity issues during a heated game session.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Artfully and its creators shall not be liable for
          any indirect, incidental, or consequential damages resulting from your use of the service.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Changes to Terms</h2>
        <p>
          We might update these terms as we add new features (like voice chat or private rooms).
          We'll update the "Last Updated" date at the top of this page whenever we do.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">Contact Us</h2>
        <p>
          If you have questions about these terms, or if someone is ruining the fun, reach out to us
          at{' '}
          <a href="mailto:magnoliadraeh@gmail.com" className="text-primary-600 hover:text-primary-700 underline">
            magnoliadraeh@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
