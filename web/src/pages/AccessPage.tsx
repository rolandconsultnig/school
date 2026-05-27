import { FormEvent, useEffect, useState } from "react";
import { accessApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function AccessPage() {
  const ctx = useApiContext();
  const [scans, setScans] = useState<ApiRecord[]>([]);
  const [rules, setRules] = useState<ApiRecord[]>([]);
  const [lockdown, setLockdown] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [gate, setGate] = useState("main");
  const [ruleName, setRuleName] = useState("");
  const [ruleGate, setRuleGate] = useState("main");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      accessApi.scans(ctx.token),
      accessApi.rules(ctx.token).catch(() => []),
      ctx.campusId
        ? accessApi.status(ctx.token, ctx.campusId)
        : Promise.resolve({ accessLockdown: false, campusId: null }),
    ])
      .then(([s, r, st]) => {
        setScans(s as ApiRecord[]);
        setRules(r as ApiRecord[]);
        setLockdown(!!st.accessLockdown);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId]);

  async function recordScan(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const result = await accessApi.recordScan(ctx.token, {
        externalId,
        gate,
        campusId: ctx.campusId,
      });
      const r = result as ApiRecord & { deniedReason?: string };
      setMsg(
        r.deniedReason
          ? String(r.deniedReason)
          : r.granted
            ? "Access granted"
            : "Access denied — unknown ID"
      );
      setExternalId("");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function toggleLockdown() {
    if (!ctx.campusId) {
      setError("Select a campus in the header to manage lockdown.");
      return;
    }
    setError("");
    try {
      await accessApi.setLockdown(ctx.token, ctx.campusId, !lockdown);
      setLockdown(!lockdown);
      setMsg(lockdown ? "Lockdown disabled" : "Campus lockdown enabled");
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function addRule(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await accessApi.createRule(ctx.token, { name: ruleName, gate: ruleGate });
      setRuleName("");
      load();
      setMsg("Access rule created.");
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Access control</h1>
        <button
          type="button"
          className={lockdown ? "btn" : "btn btn-secondary"}
          onClick={toggleLockdown}
          style={{ marginLeft: "auto" }}
        >
          {lockdown ? "Disable lockdown" : "Enable campus lockdown"}
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        <form className="card" onSubmit={recordScan}>
          <h3>Record scan</h3>
          <div className="form-group">
            <label>Student ID / card code</label>
            <input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Gate</label>
            <input value={gate} onChange={(e) => setGate(e.target.value)} />
          </div>
          <button type="submit" className="btn">
            Scan
          </button>
        </form>
        <form className="card" onSubmit={addRule}>
          <h3>Access rules</h3>
          <div className="form-group">
            <label>Rule name</label>
            <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Gate</label>
            <input value={ruleGate} onChange={(e) => setRuleGate(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-secondary">
            Add rule
          </button>
          <ul style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            {rules.map((r) => (
              <li key={recordId(r)}>
                {String(r.name)} — gate {String(r.gate ?? "—")}
              </li>
            ))}
          </ul>
        </form>
      </div>
      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <h3>Recent scans</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Student</th>
              <th>Gate</th>
              <th>Granted</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={recordId(s)}>
                <td>{String(s.scannedAt ?? "").slice(0, 19)}</td>
                <td>{String(s.studentName ?? s.externalId ?? "—")}</td>
                <td>{String(s.gate)}</td>
                <td>{s.granted ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
