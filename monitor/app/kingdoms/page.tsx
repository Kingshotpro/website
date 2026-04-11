import Link from "next/link";
import { getAllKingdoms } from "@/lib/db";

const TIER_COLORS: Record<string, string> = {
  S: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  A: "text-green-400 bg-green-400/10 border-green-400/30",
  B: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  C: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  D: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function KingdomsPage() {
  const kingdoms = getAllKingdoms();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">All Kingdoms</h1>
          <p className="text-gray-400 text-sm mt-1">{kingdoms.length} kingdoms tracked</p>
        </div>
        <Link href="/submit"
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
          + Submit Data
        </Link>
      </div>

      {kingdoms.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-4">🏰</div>
          <div className="font-semibold mb-2">No kingdoms yet</div>
          <div className="text-sm mb-6">Be the first to submit alliance rankings for your kingdom.</div>
          <Link href="/submit" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
            Submit Your Kingdom
          </Link>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800 text-left text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Kingdom</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Alliances</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {kingdoms.map(k => (
                <tr key={k.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-amber-400">K{k.id}</div>
                    {k.name && <div className="text-gray-400 text-xs mt-0.5">{k.name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {k.tier ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${TIER_COLORS[k.tier] ?? TIER_COLORS.C}`}>
                        {k.tier}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {k.alliance_count > 0 ? k.alliance_count : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {k.latest_snapshot
                      ? new Date(k.latest_snapshot).toLocaleDateString()
                      : <span className="text-gray-600">No data</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/kingdoms/${k.id}`}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
