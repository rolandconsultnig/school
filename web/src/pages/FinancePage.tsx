import { FormEvent, useEffect, useState } from "react";
import { financeApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function FinancePage() {
  const ctx = useApiContext();
  const [structures, setStructures] = useState<ApiRecord[]>([]);
  const [fees, setFees] = useState<ApiRecord[]>([]);
  const [defaulters, setDefaulters] = useState<ApiRecord[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      financeApi.feeStructures(ctx.token, ctx.campusId, ctx.tier),
      financeApi.studentFees(ctx.token, {}, ctx.campusId, ctx.tier),
      financeApi.defaulters(ctx.token, ctx.campusId, ctx.tier),
    ])
      .then(([s, f, d]) => {
        setStructures(s as ApiRecord[]);
        setFees(f as ApiRecord[]);
        setDefaulters(d as ApiRecord[]);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function addStructure(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await financeApi.createFeeStructure(
        ctx.token,
        { name, amount: Number(amount), campusId: ctx.campusId, tier: ctx.tier },
        ctx.campusId,
        ctx.tier
      );
      setName("");
      setAmount("");
      setMsg("Fee structure created.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Finance</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            try {
              const blob = await financeApi.exportLedger(ctx.token!, {}, ctx.campusId, ctx.tier);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "fee-ledger.csv";
              a.click();
            } catch (err) {
              setError(String((err as Error).message));
            }
          }}
        >
          Export ledger CSV
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        <form className="card" onSubmit={addStructure}>
          <h3>New fee structure</h3>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Amount (NGN)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">
            Save
          </button>
        </form>
        <div className="card">
          <h3>Fee structures ({structures.length})</h3>
          <ul>
            {structures.map((s) => (
              <li key={recordId(s)}>
                {String(s.name)} — ₦{Number(s.amount).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <h3>Outstanding fees ({defaulters.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Fee</th>
              <th>Balance</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {defaulters.map((r) => (
              <tr key={recordId(r)}>
                <td>{String(r.studentName)}</td>
                <td>{String(r.feeName)}</td>
                <td>₦{Number(r.balance ?? 0).toLocaleString()}</td>
                <td>
                  <span className="badge">{String(r.status)}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem" }}
                    onClick={async () => {
                      const amount = prompt("Payment amount (NGN):", String(r.balance ?? 0));
                      if (!amount) return;
                      try {
                        await financeApi.recordPayment(
                          ctx.token,
                          recordId(r),
                          Number(amount),
                          ctx.campusId,
                          ctx.tier
                        );
                        setMsg("Payment recorded.");
                        load();
                      } catch (err) {
                        setError(String((err as Error).message));
                      }
                    }}
                  >
                    Record pay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fees.length === 0 && defaulters.length === 0 && (
          <p className="empty">No student fees yet — assign from student profile.</p>
        )}
      </div>
    </div>
  );
}
