import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

const PAYSTACK_CALLBACK = `${window.location.origin}/paystack/callback`;

export function StudentFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<ApiRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  function load() {
    if (!user?.token) return;
    studentPortalApi
      .fees(user.token)
      .then((d) => {
        setFees(d.fees as ApiRecord[]);
        setTotal(d.totalOutstanding);
      })
      .catch((e) => setError(String((e as Error).message)));
  }

  useEffect(() => {
    load();
  }, [user?.token]);

  async function payFee(feeId: string) {
    if (!user?.token) return;
    setPayingId(feeId);
    setError("");
    setMsg("");
    try {
      const init = await studentPortalApi.initializePaystack(
        user.token,
        feeId,
        PAYSTACK_CALLBACK
      );
      window.location.href = init.authorization_url;
    } catch (err) {
      setError(String((err as Error).message));
      setPayingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="My ledger & fees"
        subtitle="Pay outstanding balances via Paystack (card, bank, USSD)"
      />
      {error && <div className="error-banner">{error}</div>}
      {msg && <p style={{ color: "var(--primary)" }}>{msg}</p>}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Outstanding balance</h3>
        <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          ₦{total.toLocaleString()}
        </p>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fee</th>
              <th>Due</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => {
              const id = recordId(f);
              const balance = Number(f.balance ?? 0);
              return (
                <tr key={id}>
                  <td>{String(f.feeName)}</td>
                  <td>₦{Number(f.amountDue).toLocaleString()}</td>
                  <td>₦{Number(f.amountPaid).toLocaleString()}</td>
                  <td>₦{balance.toLocaleString()}</td>
                  <td>
                    <span className="badge">{String(f.status)}</span>
                  </td>
                  <td>
                    {balance > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={payingId === id}
                        onClick={() => payFee(id)}
                      >
                        {payingId === id ? "Redirecting…" : "Pay"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {fees.length === 0 && <p className="empty">No fee records</p>}
      </div>
    </div>
  );
}
