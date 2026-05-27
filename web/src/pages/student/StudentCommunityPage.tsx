import { FormEvent, useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentCommunityPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<ApiRecord[]>([]);
  const [messages, setMessages] = useState<ApiRecord[]>([]);
  const [teachers, setTeachers] = useState<ApiRecord[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [feedbackCat, setFeedbackCat] = useState("SUGGESTION");
  const [feedbackBody, setFeedbackBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    if (!user?.token) return;
    Promise.all([
      studentPortalApi.announcements(user.token),
      studentPortalApi.messages(user.token),
      studentPortalApi.teachers(user.token),
    ])
      .then(([a, m, t]) => {
        setAnnouncements(a as ApiRecord[]);
        setMessages(m as ApiRecord[]);
        setTeachers(t as ApiRecord[]);
        if (t[0]) setTeacherId(recordId(t[0] as ApiRecord));
      })
      .catch((e) => setError(String((e as Error).message)));
  }

  useEffect(() => {
    load();
  }, [user?.token]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!user?.token) return;
    setMsg("");
    try {
      await studentPortalApi.sendMessage(user.token, { teacherId, subject, body });
      setMsg("Message sent to teacher.");
      setBody("");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function sendFeedback(e: FormEvent) {
    e.preventDefault();
    if (!user?.token) return;
    try {
      await studentPortalApi.feedback(user.token, {
        category: feedbackCat,
        body: feedbackBody,
        isAnonymous: anonymous,
      });
      setMsg("Feedback submitted — thank you.");
      setFeedbackBody("");
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="Community" subtitle="Notices, messaging, and feedback" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        <div className="card">
          <h3>School notice board</h3>
          {announcements.length === 0 ? (
            <p className="empty">No announcements</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {announcements.map((a) => (
                <li
                  key={recordId(a)}
                  style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}
                >
                  {!!a.isPinned && <span className="badge">Pinned</span>}{" "}
                  <strong>{String(a.title)}</strong>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>
                    {String(a.body)}
                  </p>
                  <small>{String(a.category)} · {String(a.publishedAt ?? "").slice(0, 10)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Message a teacher</h3>
          <form onSubmit={sendMessage}>
            <div className="form-group">
              <label>Teacher</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
                {teachers.map((t) => (
                  <option key={recordId(t)} value={recordId(t)}>
                    {String(t.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} />
            </div>
            <button type="submit" className="btn">
              Send
            </button>
          </form>
          {messages.length > 0 && (
            <>
              <h4 style={{ marginTop: "1.25rem" }}>Sent</h4>
              <ul>
                {messages.slice(0, 5).map((m) => (
                  <li key={recordId(m)}>
                    To {String(m.teacherName)}: {String(m.body).slice(0, 60)}…
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <form className="card" onSubmit={sendFeedback} style={{ marginTop: "1rem" }}>
        <h3>Feedback box</h3>
        <div className="form-group">
          <label>Category</label>
          <select value={feedbackCat} onChange={(e) => setFeedbackCat(e.target.value)}>
            <option value="SUGGESTION">Suggestion</option>
            <option value="MAINTENANCE">Maintenance issue</option>
            <option value="COUNCIL">Student council</option>
          </select>
        </div>
        <div className="form-group">
          <label>Your feedback</label>
          <textarea
            value={feedbackBody}
            onChange={(e) => setFeedbackBody(e.target.value)}
            required
            rows={3}
          />
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Submit anonymously
        </label>
        <button type="submit" className="btn" style={{ marginTop: "0.75rem" }}>
          Submit feedback
        </button>
      </form>
    </div>
  );
}
