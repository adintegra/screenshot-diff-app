"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [diffStats, setDiffStats] = useState<{ diffCount: number; totalPixels: number; diffPercentage: number } | null>(null);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch list of screenshots from public folder (naive: just fetch on mount)
  useEffect(() => {
    async function fetchScreenshots() {
      // This is a naive approach: in production, you might want an API route to list files
      const res = await fetch("/api/list-screenshots");
      if (res.ok) {
        const data = await res.json();
        setScreenshots(data.files);
      }
    }
    fetchScreenshots();
  }, [screenshotImage, diffImage]);

  const handleScreenshot = async () => {
    setLoading(true);
    setError("");
    setScreenshotImage(null);
    try {
      const res = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setScreenshotImage(data.path);
      } else {
        setError(data.error || "Screenshot failed");
      }
    } catch {
      setError("Screenshot failed");
    }
    setLoading(false);
  };

  const handleDiff = async () => {
    setLoading(true);
    setError("");
    setDiffImage(null);
    setDiffStats(null);
    try {
      const res = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileA: selectedA, fileB: selectedB }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiffImage(data.path);
        setDiffStats({
          diffCount: data.diffCount,
          totalPixels: data.totalPixels,
          diffPercentage: data.diffPercentage
        });
      } else {
        setError(data.error || "Diff failed");
      }
    } catch {
      setError("Diff failed");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Screenshot Diff App</h1>
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Enter URL to screenshot"
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ width: 300, marginRight: 8 }}
          />
          <button onClick={handleScreenshot} disabled={loading || !url}>
            {loading ? "Processing..." : "Take Screenshot"}
          </button>
        </div>
        {screenshotImage && (
          <div>
            <h3>Latest Screenshot</h3>
            <img src={screenshotImage} alt="Screenshot" style={{ maxWidth: 400, border: '1px solid #ccc' }} />
          </div>
        )}
        <hr style={{ margin: '32px 0' }} />
        <h2>Compare Screenshots</h2>
        <div style={{ marginBottom: 16 }}>
          <select value={selectedA} onChange={e => setSelectedA(e.target.value)}>
            <option value="">Select Screenshot A</option>
            {screenshots.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <span style={{ margin: '0 8px' }}>vs</span>
          <select value={selectedB} onChange={e => setSelectedB(e.target.value)}>
            <option value="">Select Screenshot B</option>
            {screenshots.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button onClick={handleDiff} disabled={loading || !selectedA || !selectedB || selectedA === selectedB} style={{ marginLeft: 8 }}>
            {loading ? "Processing..." : "Compare"}
          </button>
        </div>
        {diffImage && (
          <div>
            <h3>Diff Result</h3>
            <img src={diffImage} alt="Diff" style={{ maxWidth: 400, border: '1px solid #ccc' }} />
            {diffStats && (
              <div style={{ marginTop: 16, fontFamily: 'monospace' }}>
                <p>Differences found: {diffStats.diffCount.toLocaleString()} pixels</p>
                <p>Total pixels: {diffStats.totalPixels.toLocaleString()}</p>
                <p>Difference: {diffStats.diffPercentage.toFixed(2)}%</p>
              </div>
            )}
          </div>
        )}
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
