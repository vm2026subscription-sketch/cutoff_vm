/**
 * Best-effort leak deterrent, not a technical guarantee: no website can
 * block OS-level screenshots, screen recording, or a phone camera pointed
 * at the screen — none of that is visible to browser JavaScript at all.
 * What this DOES do is make every screenshot/recording traceable back to
 * the exact account and moment it was taken, the same approach Netflix and
 * exam portals use for this same reason.
 */
export function Watermark({ email, orderId }: { email: string; orderId: string }) {
  const stamp = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const label = `${email} · #${orderId.slice(-8)} · ${stamp}`;

  // Repeat the label across a small SVG tile, then tile that as a CSS
  // background — cheap to render and keeps text crisp at any zoom level.
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="220">
      <text x="10" y="60" font-family="Helvetica, Arial, sans-serif" font-size="13"
            fill="rgba(20,40,80,0.09)" transform="rotate(-28 210 110)">${label}</text>
      <text x="10" y="160" font-family="Helvetica, Arial, sans-serif" font-size="13"
            fill="rgba(20,40,80,0.09)" transform="rotate(-28 210 110)">${label}</text>
    </svg>
  `);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}
