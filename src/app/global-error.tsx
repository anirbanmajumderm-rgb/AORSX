"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050505",
            padding: "16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "540px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,107,0,0.2), rgba(0,229,255,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "36px",
              }}
            >
              ⚡
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
              Critical Error
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px", lineHeight: 1.5 }}>
              The application encountered a critical failure.
            </p>
            {isDev && error.message && (
              <p
                style={{
                  color: "rgba(255,107,0,0.6)",
                  fontSize: "13px",
                  marginBottom: "24px",
                  padding: "8px 12px",
                  background: "rgba(255,107,0,0.08)",
                  borderRadius: "8px",
                  wordBreak: "break-word",
                }}
              >
                {error.message}
              </p>
            )}
            {error.digest && (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", marginBottom: "24px" }}>
                Ref: {error.digest}
              </p>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(90deg, #FF6B00, #00E5FF)",
                  color: "black",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
