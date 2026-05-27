import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { analyticsApi, idcardApi, sisApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId } from "../types";

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const ctx = useApiContext();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [reportCards, setReportCards] = useState<Record<string, unknown>[]>([]);

  function reload() {
    if (!ctx.token || !studentId) return;
    Promise.all([
      sisApi.profile360(ctx.token, studentId, ctx.campusId, ctx.tier),
      analyticsApi.reportCards(ctx.token, studentId, ctx.campusId, ctx.tier).catch(() => []),
    ])
      .then(([p, cards]) => {
        const data = p as Record<string, unknown>;
        setProfile(data);
        setReportCards(cards as Record<string, unknown>[]);
        const h = data.health as Record<string, unknown> | null;
        setBloodGroup(String(h?.bloodGroup ?? ""));
        setAllergies(String(h?.allergies ?? ""));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  async function printReportCard(reportCardId: string) {
    if (!ctx.token) return;
    const html = await analyticsApi.reportCardHtml(
      ctx.token,
      reportCardId,
      ctx.campusId,
      ctx.tier
    );
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank", "noopener");
  }

  useEffect(() => {
    reload();
  }, [ctx.token, studentId, ctx.campusId, ctx.tier]);

  async function saveHealth(e: FormEvent) {
    e.preventDefault();
    if (!ctx.token || !studentId) return;
    setActionMsg("");
    try {
      await sisApi.updateHealth(
        ctx.token,
        studentId,
        { bloodGroup, allergies },
        ctx.campusId,
        ctx.tier
      );
      setActionMsg("Health record saved.");
      reload();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function addContact(e: FormEvent) {
    e.preventDefault();
    if (!ctx.token || !studentId) return;
    try {
      await sisApi.addEmergencyContact(
        ctx.token,
        studentId,
        { name: contactName, phone: contactPhone },
        ctx.campusId,
        ctx.tier
      );
      setContactName("");
      setContactPhone("");
      setActionMsg("Emergency contact added.");
      reload();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function uploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!ctx.token || !studentId || !docFile) return;
    try {
      await sisApi.uploadDocument(
        ctx.token,
        studentId,
        docFile,
        docTitle,
        ctx.campusId,
        ctx.tier
      );
      setDocTitle("");
      setDocFile(null);
      setActionMsg("Document uploaded.");
      reload();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  if (error && !profile) return <div className="error-banner">{error}</div>;
  if (!profile) return <p className="empty">Loading student profile…</p>;

  const contacts = (profile.emergencyContacts as unknown[]) ?? [];
  const documents = (profile.documents as unknown[]) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>{String(profile.name)}</h1>
        <span className="badge">{String(profile.tier ?? "")}</span>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              if (!ctx.token || !studentId) return;
              setActionMsg("");
              try {
                const card = await idcardApi.issue(
                  ctx.token,
                  studentId,
                  undefined,
                  ctx.campusId,
                  ctx.tier
                );
                setActionMsg(
                  `ID card issued — QR: ${String((card as Record<string, unknown>).qrPayload ?? "")}`
                );
              } catch (e) {
                setActionMsg(String((e as Error).message));
              }
            }}
          >
            Issue ID card
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              if (!ctx.token || !studentId) return;
              setActionMsg("");
              try {
                await analyticsApi.generateReportCard(
                  ctx.token,
                  studentId,
                  undefined,
                  ctx.campusId,
                  ctx.tier
                );
                setActionMsg("Report card generated.");
                reload();
              } catch (e) {
                setActionMsg(String((e as Error).message));
              }
            }}
          >
            Generate report card
          </button>
        </div>
      </div>
      {reportCards.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Report cards</h3>
          <ul>
            {reportCards.map((rc) => (
              <li key={String(rc.id)} style={{ marginBottom: "0.35rem" }}>
                {String(rc.createdAt ?? "").slice(0, 10)}{" "}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
                  onClick={() => printReportCard(String(rc.id))}
                >
                  Print
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
      {actionMsg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {actionMsg}
        </div>
      )}
      <div className="grid-2">
        <div className="card">
          <h3>Overview</h3>
          <p>
            <strong>Email:</strong> {String(profile.email)}
          </p>
          <p>
            <strong>Section:</strong> {String(profile.section ?? "—")}
          </p>
        </div>
        <form className="card" onSubmit={saveHealth}>
          <h3>Health record</h3>
          <div className="form-group">
            <label>Blood group</label>
            <input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Allergies</label>
            <input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-secondary">
            Save health
          </button>
        </form>
        <div className="card">
          <h3>Emergency contacts ({contacts.length})</h3>
          <ul>
            {contacts.map((c, i) => {
              const x = c as Record<string, unknown>;
              return (
                <li key={i}>
                  {String(x.name)} — {String(x.phone)}
                </li>
              );
            })}
          </ul>
          <form onSubmit={addContact} style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label>Name</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-secondary">
              Add contact
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Documents ({documents.length})</h3>
          <ul>
            {documents.map((d) => {
              const x = d as Record<string, unknown>;
              const docId = recordId(x);
              return (
                <li key={docId || String(x.title)}>
                  <a href={String(x.fileUrl)} target="_blank" rel="noreferrer">
                    {String(x.title)}
                  </a>{" "}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.7rem", marginLeft: "0.5rem" }}
                    onClick={async () => {
                      if (!docId) return;
                      await sisApi.deleteDocument(ctx.token, docId, ctx.campusId, ctx.tier);
                      setActionMsg("Document removed.");
                      reload();
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <form onSubmit={uploadDocument} style={{ marginTop: "1rem" }}>
            <div className="form-group">
              <label>Title</label>
              <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>File</label>
              <input
                type="file"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Upload document
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
