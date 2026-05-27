import { useEffect, useState } from "react";
import { parentApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    parentApi
      .messages(user.token)
      .then((m) => setMessages(m as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader title="PTA messages" subtitle="Conversation with teachers" />
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        {messages.length === 0 ? (
          <p className="empty">No messages yet</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {messages.map((m) => (
              <li
                key={recordId(m)}
                style={{
                  padding: "1rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <strong>{String(m.teacherName ?? "Teacher")}</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  re: {String(m.studentName ?? "Student")}
                </span>
                <p style={{ margin: "0.5rem 0 0" }}>{String(m.body)}</p>
                <small style={{ color: "var(--muted)" }}>
                  {String(m.createdAt ?? "").slice(0, 16)}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
