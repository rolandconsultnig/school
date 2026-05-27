import { FormEvent, useEffect, useState } from "react";
import { ptaApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function PtaCommunityPage() {
  const ctx = useApiContext();
  const { isParent } = useAuth();
  const [tab, setTab] = useState<"meetings" | "polls" | "announcements">("meetings");
  const [meetings, setMeetings] = useState<ApiRecord[]>([]);
  const [polls, setPolls] = useState<ApiRecord[]>([]);
  const [announcements, setAnnouncements] = useState<ApiRecord[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [question, setQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Yes\nNo");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const q: Record<string, string> = {};
  if (ctx.campusId) q.campusId = ctx.campusId;

  function load() {
    if (!ctx.token) return;
    Promise.all([
      ptaApi.meetings(ctx.token, q),
      ptaApi.polls(ctx.token, q),
      ptaApi.announcements(ctx.token, q),
    ])
      .then(([m, p, a]) => {
        setMeetings(m as ApiRecord[]);
        setPolls(p as ApiRecord[]);
        setAnnouncements(a as ApiRecord[]);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId]);

  async function createMeeting(e: FormEvent) {
    e.preventDefault();
    try {
      await ptaApi.createMeeting(ctx.token!, {
        campusId: ctx.campusId,
        title,
        startsAt,
      });
      setMsg("Meeting scheduled.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function createPoll(e: FormEvent) {
    e.preventDefault();
    try {
      await ptaApi.createPoll(ctx.token!, {
        campusId: ctx.campusId,
        question,
        options: pollOptions.split("\n").filter(Boolean),
      });
      setMsg("Poll created.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function createAnnouncement(e: FormEvent) {
    e.preventDefault();
    try {
      await ptaApi.createAnnouncement(ctx.token!, {
        campusId: ctx.campusId,
        title: annTitle,
        body: annBody,
        isPinned: false,
      });
      setMsg("Announcement published.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="PTA community" subtitle="Meetings, polls, and announcements" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>{msg}</div>
      )}
      <div className="portal-tabs" style={{ marginBottom: "1rem" }}>
        {(["meetings", "polls", "announcements"] as const).map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "meetings" && (
        <div className="grid-2">
          {!isParent && (
            <form className="card" onSubmit={createMeeting}>
              <h3>Schedule meeting</h3>
              <div className="form-group">
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Starts</label>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
              </div>
              <button type="submit" className="btn">Create</button>
            </form>
          )}
          <div className="card">
            <h3>Upcoming</h3>
            <ul>
              {meetings.map((m) => (
                <li key={recordId(m)}>
                  <strong>{String(m.title)}</strong> — {String(m.startsAt ?? "").slice(0, 16)}
                  {isParent && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginLeft: "0.5rem" }}
                      onClick={() =>
                        ptaApi.rsvpMeeting(ctx.token!, recordId(m), "GOING").then(load)
                      }
                    >
                      RSVP
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {tab === "polls" && (
        <div className="grid-2">
          {!isParent && (
            <form className="card" onSubmit={createPoll}>
              <h3>New poll</h3>
              <div className="form-group">
                <label>Question</label>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Options (one per line)</label>
                <textarea value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} rows={3} />
              </div>
              <button type="submit" className="btn">Publish poll</button>
            </form>
          )}
          <div className="card">
            {polls.map((p) => (
              <div key={recordId(p)} style={{ marginBottom: "1rem" }}>
                <strong>{String(p.question)}</strong>
                <ul>
                  {((p.options as ApiRecord[]) || []).map((o) => (
                    <li key={recordId(o)}>
                      {String(o.label)}
                      {isParent && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginLeft: "0.5rem" }}
                          onClick={() =>
                            ptaApi.votePoll(ctx.token!, recordId(p), recordId(o)).then(load)
                          }
                        >
                          Vote
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "announcements" && (
        <div className="grid-2">
          {!isParent && (
            <form className="card" onSubmit={createAnnouncement}>
              <h3>Post announcement</h3>
              <div className="form-group">
                <label>Title</label>
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} required rows={4} />
              </div>
              <button type="submit" className="btn">Publish</button>
            </form>
          )}
          <div className="card">
            {announcements.map((a) => (
              <div key={recordId(a)} style={{ marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.25rem" }}>{String(a.title)}</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>{String(a.body)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
