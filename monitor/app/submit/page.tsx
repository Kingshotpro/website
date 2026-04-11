"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface RankingEntry {
  rank: number;
  tag: string;
  name: string;
  power: number;
}

function fmt(power: number): string {
  if (power >= 1_000_000_000) return (power / 1_000_000_000).toFixed(3) + "B";
  if (power >= 1_000_000) return (power / 1_000_000).toFixed(1) + "M";
  return power.toLocaleString();
}

function SubmitForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kingdomId, setKingdomId] = useState(searchParams.get("kingdom") ?? "");
  const [contributor, setContributor] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[] | null>(null);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileDrop(f: File) {
    setFile(f);
    setRankings(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("screenshot", file);
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setRankings(data.rankings);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse screenshot");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    if (!rankings || !kingdomId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kingdom_id: parseInt(kingdomId),
          captured_at: new Date().toISOString(),
          submitted_by: contributor || null,
          rankings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setStep("done");
      setTimeout(() => router.push(`/kingdoms/${kingdomId}`), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-xl font-bold mb-2">Rankings saved!</div>
        <div className="text-gray-400 text-sm">Redirecting to Kingdom {kingdomId}...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Submit Alliance Rankings</h1>
        <p className="text-gray-400 text-sm">
          Take a screenshot of the Alliance Power Rankings screen in Kingshots and upload it here.
          We extract the data automatically.
        </p>
      </div>

      {/* Kingdom ID */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Kingdom Number <span className="text-red-400">*</span></label>
        <input
          type="number"
          value={kingdomId}
          onChange={e => setKingdomId(e.target.value)}
          placeholder="e.g. 223"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
        />
      </div>

      {/* Contributor (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Your name / handle <span className="text-gray-600 font-normal">(optional)</span></label>
        <input
          type="text"
          value={contributor}
          onChange={e => setContributor(e.target.value)}
          placeholder="e.g. PlayerName123"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
        />
      </div>

      {/* Screenshot upload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Screenshot <span className="text-red-400">*</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFileDrop(f);
          }}
          className="border-2 border-dashed border-gray-700 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          {preview ? (
            <img src={preview} alt="Screenshot preview" className="max-h-64 mx-auto rounded-lg" />
          ) : (
            <div>
              <div className="text-3xl mb-3">📸</div>
              <div className="text-sm text-gray-400">Drop screenshot here or click to browse</div>
              <div className="text-xs text-gray-600 mt-1">PNG, JPG, WebP supported</div>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFileDrop(f);
          }}
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Step: upload → parse */}
      {step === "upload" && (
        <button
          onClick={handleParse}
          disabled={!file || !kingdomId || parsing}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold py-3 rounded-lg transition-colors"
        >
          {parsing ? "Reading screenshot..." : "Extract Rankings →"}
        </button>
      )}

      {/* Step: review → submit */}
      {step === "review" && rankings && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            Extracted {rankings.length} alliances — does this look right?
          </h2>
          <div className="border border-gray-800 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Tag</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-right">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {rankings.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-900/50">
                    <td className="px-3 py-2 font-bold text-amber-400">{r.rank}</td>
                    <td className="px-3 py-2">
                      {r.tag ? (
                        <span className="font-mono text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">[{r.tag}]</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-200">{r.name || <span className="text-gray-600 italic">Unknown</span>}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-200">{fmt(r.power)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep("upload"); setRankings(null); }}
              className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              ← Re-upload
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-bold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? "Saving..." : "Confirm & Save →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense>
      <SubmitForm />
    </Suspense>
  );
}
