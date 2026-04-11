import Link from "next/link";
import { notFound } from "next/navigation";
import { getKingdom, getLatestRankings } from "@/lib/db";

function fmt(power: number): string {
  if (power >= 1_000_000_000) return (power / 1_000_000_000).toFixed(2) + "B";
  if (power >= 1_000_000) return (power / 1_000_000).toFixed(1) + "M";
  return power.toLocaleString();
}

export default async function KingdomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kingdomId = parseInt(id);
  if (isNaN(kingdomId)) notFound();

  const kingdom = getKingdom(kingdomId);
  if (!kingdom) notFound();

  const rankings = getLatestRankings(kingdomId);
  const topPower = rankings[0]?.power ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-gray-500 text-sm mb-1">
            <Link href="/kingdoms" className="hover:text-gray-300">Kingdoms</Link>
            <span className="mx-2">›</span>
            K{kingdom.id}
          </div>
          <h1 className="text-3xl font-bold text-amber-400">Kingdom {kingdom.id}</h1>
          {kingdom.name && <div className="text-gray-400 mt-1">{kingdom.name}</div>}
          {kingdom.latest_snapshot && (
            <div className="text-xs text-gray-600 mt-2">
              Last updated {new Date(kingdom.latest_snapshot).toLocaleString()}
            </div>
          )}
        </div>
        <Link href={`/submit?kingdom=${kingdom.id}`}
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">
          Update Data
        </Link>
      </div>

      {/* Rankings table */}
      {rankings.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <div className="font-semibold mb-2">No ranking data yet</div>
          <div className="text-sm mb-6">Submit a screenshot of the alliance power rankings for this kingdom.</div>
          <Link href={`/submit?kingdom=${kingdom.id}`}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
            Submit Rankings
          </Link>
        </div>
      ) : (
        <>
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 w-12">Rank</th>
                  <th className="px-4 py-3 w-20">Tag</th>
                  <th className="px-4 py-3">Alliance</th>
                  <th className="px-4 py-3 text-right">Power</th>
                  <th className="px-4 py-3 w-32 text-right">vs #1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {rankings.map((r, i) => {
                  const gap = r.power - topPower;
                  const pct = topPower > 0 ? (r.power / topPower) * 100 : 0;
                  return (
                    <tr key={i} className={`transition-colors ${i === 0 ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-gray-900/50"}`}>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${i === 0 ? "text-amber-400 text-base" : "text-gray-400"}`}>
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.tag ? (
                          <span className="text-xs font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                            [{r.tag}]
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-100">
                          {r.name || <span className="text-gray-600 italic">Unknown</span>}
                        </div>
                        {/* Power bar */}
                        <div className="mt-1 h-1 bg-gray-800 rounded-full w-40 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${i === 0 ? "bg-amber-400" : "bg-gray-600"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-200">
                        {fmt(r.power)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {i === 0 ? (
                          <span className="text-amber-400 font-semibold">#1</span>
                        ) : (
                          <span className="text-red-400 font-mono">{fmt(gap)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-3 text-right">
            Data from {new Date(rankings[0].captured_at).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
