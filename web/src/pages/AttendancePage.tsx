import { FormEvent, useEffect, useState } from "react";
import {
  academicApi,
  attendanceApi,
  attendanceDetailApi,
  classesApi,
  teachersApi,
} from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

type Tab = "roll" | "timetable" | "substitutions" | "door";

export function AttendancePage() {
  const ctx = useApiContext();
  const [tab, setTab] = useState<Tab>("roll");
  const [sessions, setSessions] = useState<ApiRecord[]>([]);
  const [classes, setClasses] = useState<ApiRecord[]>([]);
  const [teachers, setTeachers] = useState<ApiRecord[]>([]);
  const [subjects, setSubjects] = useState<ApiRecord[]>([]);
  const [slots, setSlots] = useState<ApiRecord[]>([]);
  const [classLevelId, setClassLevelId] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [slotClassId, setSlotClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [doorJson, setDoorJson] = useState(
    '[{"externalId":"STU-001","scannedAt":"2026-05-23T08:05:00Z","gate":"main"}]'
  );
  const [substitutions, setSubstitutions] = useState<ApiRecord[]>([]);
  const [subSlotId, setSubSlotId] = useState("");
  const [subTeacherId, setSubTeacherId] = useState("");
  const [subDate, setSubDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function timeToMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function loadSessions() {
    attendanceApi
      .sessions(ctx.token, {}, ctx.campusId, ctx.tier)
      .then((s) => setSessions(s as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  function loadSlots() {
    if (!slotClassId) return;
    attendanceApi
      .slots(ctx.token, { classLevelId: slotClassId }, ctx.campusId, ctx.tier)
      .then((s) => setSlots(s as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    loadSessions();
    classesApi.list(ctx.token, ctx.campusId, ctx.tier).then((c) => {
      setClasses(c as ApiRecord[]);
      const first = c[0] ? recordId(c[0] as ApiRecord) : "";
      if (first) {
        setClassLevelId(first);
        setSlotClassId(first);
      }
    });
    teachersApi.list(ctx.token).then((t) => {
      setTeachers(t as ApiRecord[]);
      if (t[0]) setTeacherId(recordId(t[0] as ApiRecord));
    });
    academicApi.subjects(ctx.token).then((s) => {
      setSubjects(s as ApiRecord[]);
      if (s[0]) setSubjectId(recordId(s[0] as ApiRecord));
    });
  }, [ctx.token, ctx.campusId, ctx.tier]);

  useEffect(() => {
    if (tab === "timetable") loadSlots();
  }, [tab, slotClassId, ctx.token, ctx.campusId, ctx.tier]);

  useEffect(() => {
    if (!activeSessionId) return;
    attendanceDetailApi
      .session(ctx.token, activeSessionId, ctx.campusId, ctx.tier)
      .then((s) => {
        const data = s as Record<string, unknown>;
        setRecords((data.records as ApiRecord[]) ?? []);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [activeSessionId, ctx.token, ctx.campusId, ctx.tier]);

  async function createSession(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const created = await attendanceApi.createSession(
        ctx.token,
        { classLevelId, sessionDate, campusId: ctx.campusId, tier: ctx.tier },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Session created — all students marked present by default.");
      loadSessions();
      const id = recordId(created as ApiRecord);
      if (id) setActiveSessionId(id);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function toggleStatus(studentId: string, current: string) {
    if (!activeSessionId) return;
    const next = current === "PRESENT" ? "ABSENT" : "PRESENT";
    const updated = records.map((r) => {
      const st = r.student as ApiRecord | undefined;
      const sid = st ? recordId(st) : String(r.studentId);
      return sid === studentId
        ? { studentId, status: next, remark: r.remark }
        : { studentId: sid, status: String(r.status), remark: r.remark };
    });
    try {
      await attendanceApi.updateRecords(
        ctx.token,
        activeSessionId,
        updated,
        ctx.campusId,
        ctx.tier
      );
      setRecords(
        records.map((r) => {
          const st = r.student as ApiRecord | undefined;
          const sid = st ? recordId(st) : String(r.studentId);
          return sid === studentId ? { ...r, status: next } : r;
        })
      );
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function createSlot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await attendanceApi.createSlot(
        ctx.token,
        {
          classLevelId: slotClassId,
          teacherId,
          subjectId,
          dayOfWeek: Number(dayOfWeek),
          startMinutes: timeToMinutes(startTime),
          endMinutes: timeToMinutes(endTime),
          room,
          campusId: ctx.campusId,
          tier: ctx.tier,
        },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Timetable slot created.");
      loadSlots();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function importDoor(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const entries = JSON.parse(doorJson);
      await attendanceApi.doorImport(
        ctx.token,
        { campusId: ctx.campusId, source: "web_ui", entries },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Door log imported.");
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Roll-call, timetable, and door imports" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="portal-tabs" style={{ marginBottom: "1rem" }}>
        {(["roll", "timetable", "substitutions", "door"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "roll"
              ? "Roll-call"
              : t === "timetable"
                ? "Timetable"
                : t === "substitutions"
                  ? "Substitutions"
                  : "Door import"}
          </button>
        ))}
      </div>
      {tab === "roll" && (
        <>
          <div className="grid-2">
            <form className="card" onSubmit={createSession}>
              <h3>New roll-call</h3>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={classLevelId}
                  onChange={(e) => setClassLevelId(e.target.value)}
                  required
                >
                  {classes.map((c) => (
                    <option key={recordId(c)} value={recordId(c)}>
                      {String(c.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                Start session
              </button>
            </form>
            <div className="card table-wrap">
              <h3>Recent sessions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Summary</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const sum = s.summary as Record<string, number> | undefined;
                    const cl = s.classLevel as ApiRecord | undefined;
                    const id = recordId(s);
                    return (
                      <tr key={id}>
                        <td>{String(s.sessionDate ?? "").slice(0, 10)}</td>
                        <td>{String(cl?.name ?? "—")}</td>
                        <td>
                          {sum ? `P ${sum.PRESENT ?? 0} / A ${sum.ABSENT ?? 0}` : "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setActiveSessionId(id)}
                          >
                            Mark
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {activeSessionId && (
            <div className="card table-wrap" style={{ marginTop: "1rem" }}>
              <h3>Mark attendance</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const st = r.student as ApiRecord | undefined;
                    const sid = st ? recordId(st) : String(r.studentId);
                    const status = String(r.status);
                    return (
                      <tr key={sid}>
                        <td>{String(st?.name ?? sid)}</td>
                        <td>
                          <span className="badge">{status}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => toggleStatus(sid, status)}
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {tab === "timetable" && (
        <div className="grid-2">
          <form className="card" onSubmit={createSlot}>
            <h3>Add slot</h3>
            <div className="form-group">
              <label>Class</label>
              <select value={slotClassId} onChange={(e) => setSlotClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={recordId(c)} value={recordId(c)}>
                    {String(c.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Teacher</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                {teachers.map((t) => (
                  <option key={recordId(t)} value={recordId(t)}>
                    {String(t.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={recordId(s)} value={recordId(s)}>
                    {String(s.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Day (1=Mon)</label>
              <input
                type="number"
                min={1}
                max={7}
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Room</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} />
            </div>
            <button type="submit" className="btn">
              Save slot
            </button>
          </form>
          <div className="card table-wrap">
            <h3>Slots</h3>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={recordId(s)}>
                    <td>{String(s.dayOfWeek)}</td>
                    <td>
                      {String(s.startMinutes)}–{String(s.endMinutes)} min
                    </td>
                    <td>{String(s.room ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {slots.length === 0 && <p className="empty">No slots for this class</p>}
          </div>
        </div>
      )}
      {tab === "substitutions" && (
        <div className="grid-2">
          <form
            className="card"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                await attendanceApi.createSubstitution(
                  ctx.token,
                  {
                    timetableSlotId: subSlotId,
                    substituteTeacherId: subTeacherId,
                    effectiveDate: subDate,
                  },
                  ctx.campusId,
                  ctx.tier
                );
                setMsg("Substitution recorded.");
                const subs = await attendanceApi.substitutions(ctx.token, {}, ctx.campusId, ctx.tier);
                setSubstitutions(subs as ApiRecord[]);
              } catch (err) {
                setError(String((err as Error).message));
              }
            }}
          >
            <h3>Assign substitute</h3>
            <div className="form-group">
              <label>Timetable slot</label>
              <select value={subSlotId} onChange={(e) => setSubSlotId(e.target.value)} required>
                <option value="">Select slot</option>
                {slots.map((s) => (
                  <option key={recordId(s)} value={recordId(s)}>
                    Day {String(s.dayOfWeek)} — {String(s.room ?? "class")}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Substitute teacher</label>
              <select value={subTeacherId} onChange={(e) => setSubTeacherId(e.target.value)} required>
                {teachers.map((t) => (
                  <option key={recordId(t)} value={recordId(t)}>
                    {String(t.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn">Save</button>
          </form>
          <div className="card">
            <h3>Recent substitutions</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                attendanceApi
                  .substitutions(ctx.token, {}, ctx.campusId, ctx.tier)
                  .then((s) => setSubstitutions(s as ApiRecord[]))
              }
            >
              Refresh
            </button>
            <ul style={{ marginTop: "0.75rem" }}>
              {substitutions.map((s) => (
                <li key={recordId(s)}>
                  Slot {String(s.timetableSlotId).slice(0, 8)}… — {String(s.effectiveDate ?? "").slice(0, 10)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {tab === "door" && (
        <form className="card" onSubmit={importDoor}>
          <h3>Import door scan JSON</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Paste an array of entries with externalId or studentId, scannedAt, and gate.
          </p>
          <textarea
            value={doorJson}
            onChange={(e) => setDoorJson(e.target.value)}
            rows={8}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
          <button type="submit" className="btn" style={{ marginTop: "1rem" }}>
            Import
          </button>
        </form>
      )}
    </div>
  );
}
