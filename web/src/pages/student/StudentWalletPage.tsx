import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentWalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .wallet(user.token)
      .then((w) => {
        setBalance(Number(w.balance));
        setTx(w.transactions as ApiRecord[]);
      })
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader
        title="Campus wallet"
        subtitle="RFID card balance for cafeteria and bookstore"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p style={{ color: "var(--muted)", margin: 0 }}>Available balance</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.25rem 0" }}>
          ₦{balance.toLocaleString()}
        </p>
        <button type="button" className="btn btn-secondary" disabled>
          Top up (coming soon)
        </button>
      </div>
      <div className="card table-wrap">
        <h3>Transaction history</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={recordId(t)}>
                <td>{String(t.createdAt ?? "").slice(0, 16)}</td>
                <td>{String(t.description)}</td>
                <td>₦{Number(t.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tx.length === 0 && <p className="empty">No transactions yet</p>}
      </div>
    </div>
  );
}
