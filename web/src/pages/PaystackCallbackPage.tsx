import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { financeApi } from "../api/client";

export function PaystackCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }
    financeApi
      .verifyPaystack(reference)
      .then(() => {
        setStatus("ok");
        setMessage("Payment verified and applied to your fee ledger.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(String(e.message ?? e));
      });
  }, [reference]);

  return (
    <div className="login-page">
      <div className="login-panel" style={{ maxWidth: 480, margin: "2rem auto" }}>
        <div className="login-card">
          <h2>Payment {status === "loading" ? "processing…" : status === "ok" ? "successful" : "failed"}</h2>
          <p>{message || "Please wait…"}</p>
          {reference && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              Reference: {reference}
            </p>
          )}
          <Link to="/services/fees" className="btn" style={{ display: "inline-block", marginTop: "1rem" }}>
            Back to fees
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ display: "inline-block", marginTop: "0.5rem", marginLeft: "0.5rem" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
