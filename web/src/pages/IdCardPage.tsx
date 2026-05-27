import { FormEvent, useEffect, useState } from "react";
import { idcardApi, studentsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

function openHtmlPreview(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank", "noopener");
}

export function IdCardPage() {
  const ctx = useApiContext();
  const [tab, setTab] = useState<"queue" | "templates" | "bulk">("queue");
  const [queue, setQueue] = useState<ApiRecord[]>([]);
  const [templates, setTemplates] = useState<ApiRecord[]>([]);
  const [students, setStudents] = useState<ApiRecord[]>([]);
  const [templateName, setTemplateName] = useState("Default");
  const [schoolName, setSchoolName] = useState("SchoolPortal Nigeria");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      idcardApi.printQueue(ctx.token, "QUEUED", ctx.campusId, ctx.tier),
      idcardApi.templates(ctx.token, ctx.campusId, ctx.tier),
      studentsApi.list(ctx.token, ctx.campusId, ctx.tier),
    ])
      .then(([q, t, s]) => {
        setQueue(q as ApiRecord[]);
        setTemplates(t as ApiRecord[]);
        setStudents(s as ApiRecord[]);
        if (t[0] && !selectedTemplate) setSelectedTemplate(recordId(t[0] as ApiRecord));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function createTemplate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await idcardApi.createTemplate(
        ctx.token,
        {
          name: templateName,
          campusId: ctx.campusId,
          isDefault: templates.length === 0,
          layoutJson: {
            schoolName,
            primaryColor,
          },
        },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Template saved.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function bulkIssue(e: FormEvent) {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      setError("Select at least one student.");
      return;
    }
    setError("");
    setMsg("");
    try {
      const result = (await idcardApi.bulkIssue(
        ctx.token,
        { studentIds: selectedStudents, templateId: selectedTemplate || undefined },
        ctx.campusId,
        ctx.tier
      )) as { issued?: number };
      setMsg(`Issued ${result.issued ?? 0} card(s).`);
      setSelectedStudents([]);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function preview(cardId: string) {
    try {
      const html = await idcardApi.previewHtml(ctx.token, cardId, ctx.campusId, ctx.tier);
      openHtmlPreview(html);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function markPrinted(cardId: string) {
    try {
      await idcardApi.markPrinted(ctx.token, cardId, ctx.campusId, ctx.tier);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>ID cards</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Design templates, bulk issue, and print queue</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="portal-tabs" style={{ marginBottom: "1rem" }}>
        <button type="button" className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}>
          Print queue ({queue.length})
        </button>
        <button type="button" className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>
          Templates
        </button>
        <button type="button" className={tab === "bulk" ? "active" : ""} onClick={() => setTab("bulk")}>
          Bulk issue
        </button>
      </div>

      {tab === "queue" && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Template</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.map((c) => (
                <tr key={recordId(c)}>
                  <td>{String(c.studentName)}</td>
                  <td>{String(c.templateName)}</td>
                  <td>
                    <span className="badge">{String(c.printStatus)}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginRight: "0.25rem" }}
                      onClick={() => preview(recordId(c))}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => markPrinted(recordId(c))}
                    >
                      Mark printed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {queue.length === 0 && <p className="empty">Print queue is empty</p>}
        </div>
      )}

      {tab === "templates" && (
        <div className="grid-2">
          <form className="card" onSubmit={createTemplate}>
            <h3>Card designer</h3>
            <div className="form-group">
              <label>Template name</label>
              <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>School name on card</label>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Header color</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
            <button type="submit" className="btn">
              Save template
            </button>
          </form>
          <div className="card">
            <h3>Saved templates</h3>
            <ul>
              {templates.map((t) => (
                <li key={recordId(t)}>
                  {String(t.name)}
                  {t.isDefault ? " (default)" : ""}
                </li>
              ))}
            </ul>
            {templates.length === 0 && <p className="empty">No templates yet</p>}
          </div>
        </div>
      )}

      {tab === "bulk" && (
        <form className="card" onSubmit={bulkIssue}>
          <h3>Bulk issue cards</h3>
          <div className="form-group">
            <label>Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templates.map((t) => (
                <option key={recordId(t)} value={recordId(t)}>
                  {String(t.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Students</label>
            <div style={{ maxHeight: 240, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem" }}>
              {students.map((s) => {
                const id = recordId(s);
                return (
                  <label key={id} style={{ display: "block", marginBottom: "0.35rem" }}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(id)}
                      onChange={() => toggleStudent(id)}
                      style={{ marginRight: "0.5rem" }}
                    />
                    {String(s.name)}
                  </label>
                );
              })}
            </div>
          </div>
          <button type="submit" className="btn">
            Issue {selectedStudents.length} card(s)
          </button>
        </form>
      )}
    </div>
  );
}
