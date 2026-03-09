import { useState } from 'react';
import { Link } from 'react-router-dom';

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>{question}</span>
        <span className="ml-4 text-gray-400 text-xl leading-none">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-gray-700 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-8">Everything you need to know about Artfully.</p>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Getting Started</h2>

        <FaqItem question="How do I play Artfully?">
          <p>Artfully is a live multiplayer drawing and guessing game for 2-8 players. Here's how it works:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Create or join a lobby with other players.</li>
            <li>The host starts the game once at least 2 players are in.</li>
            <li>Each round, one player is chosen to draw. They pick a word from three options (Easy, Medium, or Hard).</li>
            <li>The drawer sketches the word while everyone else tries to guess it by typing in the chat.</li>
            <li>The faster you guess correctly, the more points you earn!</li>
            <li>After all rounds are done, players are ranked by total points.</li>
          </ol>
        </FaqItem>

        <FaqItem question="What game modes are available?">
          <p>There are two modes:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Normal Mode:</strong> 3 rounds per player, 90 seconds to draw, up to 500 points per round.</li>
            <li><strong>Quick Mode:</strong> 2 rounds per player, 60 seconds to draw, up to 300 points per round.</li>
          </ul>
        </FaqItem>

        <FaqItem question="How does scoring work?">
          <p>Points are based on the word difficulty and how quickly you guess:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Easy words:</strong> Up to 300 points</li>
            <li><strong>Medium words:</strong> Up to 400 points</li>
            <li><strong>Hard words:</strong> Up to 500 points</li>
          </ul>
          <p>The first correct guesser gets the full base points. Later guessers earn fewer points based on time remaining. The drawer also earns points based on how many players guessed correctly.</p>
        </FaqItem>

        <FaqItem question="Do I get hints while guessing?">
          <p>Yes! Letters in the word are gradually revealed as hints:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>1st hint at 60 seconds remaining</li>
            <li>2nd hint at 40 seconds remaining</li>
            <li>3rd hint at 20 seconds remaining</li>
          </ul>
        </FaqItem>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Coins & Shop</h2>

        <FaqItem question="How do I earn coins?">
          <p>You earn coins by playing games:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>+50 coins</strong> for each correct guess</li>
            <li><strong>+100 coins</strong> as the drawer if every player guesses your drawing</li>
            <li><strong>+500 coins</strong> for finishing 1st place</li>
            <li><strong>+300 coins</strong> for finishing 2nd place</li>
            <li><strong>+250 coins</strong> for finishing 3rd place</li>
          </ul>
        </FaqItem>

        <FaqItem question="What can I buy in the shop?">
          <p>
            The <Link to="/shop" className="text-primary-600 hover:text-primary-700 underline">Shop</Link> has
            items across four categories:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Drawing:</strong> Special brush effects like the Neon Brush (2,500 coins) and Glitter Brush (1,000 coins).</li>
            <li><strong>Profile:</strong> Customize your look with Gold Frame (10,000 coins), Rainbow Frame (5,000 coins), or Fire Name effect (10,000 coins).</li>
            <li><strong>Themes:</strong> Full UI themes like Sunset Theme and Ocean Theme (5,000 coins each).</li>
            <li><strong>Gameplay:</strong> Upgrades like Extra Save Slots (1,000 coins) and Fireworks Finisher (5,000 coins).</li>
          </ul>
        </FaqItem>

        <FaqItem question="How do I unlock special brushes?">
          <p>Special brushes are purchased from the Shop with coins you earn from playing games:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Neon Brush</strong> (2,500 coins) — Adds a glowing neon effect to your strokes.</li>
            <li><strong>Glitter Brush</strong> (1,000 coins) — Adds sparkle particles as you draw.</li>
          </ul>
          <p>Once purchased, you can select them from the brush options while drawing.</p>
        </FaqItem>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Features</h2>

        <FaqItem question="What is Practice Mode?">
          <p>Practice Mode lets you draw freely without being in a game. You can experiment with brushes, replay your drawing process, and save your creations to your Gallery (up to 3 slots, or 10 with the Extra Save Slots upgrade).</p>
        </FaqItem>

        <FaqItem question="What is the Wonder Hall?">
          <p>The Wonder Hall (Hall of Fame) is a curated showcase of the best drawings from the community. Featured drawings can be liked and replayed so you can watch how they were made.</p>
        </FaqItem>

        <FaqItem question="How does the Leaderboard work?">
          <p>The Leaderboard ranks players by total all-time points. You can also view country-specific rankings. Your profile shows stats like games played, games won, win rate, and total points.</p>
        </FaqItem>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Drawing Tools</h2>

        <FaqItem question="What drawing tools are available?">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Pen:</strong> The default drawing tool with adjustable size (1-50px) and opacity (10-100%).</li>
            <li><strong>Eraser:</strong> Remove parts of your drawing.</li>
            <li><strong>Fill Bucket:</strong> Fill an area with color.</li>
            <li><strong>Undo:</strong> Undo your last action.</li>
            <li><strong>Clear:</strong> Wipe the canvas clean.</li>
          </ul>
          <p>If you own special brushes (Neon or Glitter), you can activate them for extra visual flair.</p>
        </FaqItem>
      </div>

      <div className="mt-10 p-5 bg-gray-50 rounded-lg text-center text-gray-600">
        <p>
          Still have questions? Reach out to us at{' '}
          <a href="mailto:magnoliadraeh@gmail.com" className="text-primary-600 hover:text-primary-700 underline">
            magnoliadraeh@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
