import Link from "next/link";
import { getAllKingdoms } from "@/lib/db";

export default function Home() {
  const kingdoms = getAllKingdoms();
  const tracked = kingdoms.length;
  const withData = kingdoms.filter(k => k.latest_snapshot).length;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Community-powered · Always free
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Alliance rankings for<br />
            <span className="text-amber-400">every Kingshots kingdom</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Track power rankings, spot rising alliances, scout before you transfer.
            Built by players, for players.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kingdoms"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-6 py-3 rounded-lg transition-colors">
              Browse Kingdoms
            </Link>
            <Link href="/submit"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Submit Your Kingdom
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 divide-x divide-gray-800 text-center">
          <div className="px-4">
            <div className="text-2xl font-bold text-amber-400">{tracked}</div>
            <div className="text-xs text-gray-500 mt-1">Kingdoms tracked</div>
          </div>
          <div className="px-4">
            <div className="text-2xl font-bold text-amber-400">{withData}</div>
            <div className="text-xs text-gray-500 mt-1">With live data</div>
          </div>
          <div className="px-4">
            <div className="text-2xl font-bold text-amber-400">Free</div>
            <div className="text-xs text-gray-500 mt-1">Always</div>
          </div>
        </div>
      </section>

      {/* Recent kingdoms */}
      {kingdoms.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recently Updated</h2>
            <Link href="/kingdoms" className="text-sm text-amber-400 hover:text-amber-300">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kingdoms.slice(0, 6).map(k => (
              <Link key={k.id} href={`/kingdoms/${k.id}`}
                className="border border-gray-800 hover:border-gray-600 bg-gray-900 rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-400">K{k.id}</span>
                  {k.tier && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{k.tier} Tier</span>
                  )}
                </div>
                {k.name && <div className="text-sm text-gray-300 mb-2">{k.name}</div>}
                <div className="text-xs text-gray-500">
                  {k.latest_snapshot
                    ? `Updated ${new Date(k.latest_snapshot).toLocaleDateString()}`
                    : 'No data yet'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t border-gray-800 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-lg font-semibold text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">📸</div>
              <div className="font-semibold mb-2">Screenshot your rankings</div>
              <div className="text-sm text-gray-400">Open alliance power rankings in-game and take a screenshot.</div>
            </div>
            <div>
              <div className="text-3xl mb-3">⬆️</div>
              <div className="font-semibold mb-2">Upload here</div>
              <div className="text-sm text-gray-400">We read the data automatically — no manual entry needed.</div>
            </div>
            <div>
              <div className="text-3xl mb-3">📊</div>
              <div className="font-semibold mb-2">Everyone benefits</div>
              <div className="text-sm text-gray-400">Your kingdom&apos;s rankings are tracked and visible to all players.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
