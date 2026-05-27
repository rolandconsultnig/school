import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { academicApi, classesApi, lmsApi, teachersApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function LmsPage() {
  const { isStudent } = useAuth();
  const ctx = useApiContext();
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [teachers, setTeachers] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [academicTermId, setAcademicTermId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [terms, setTerms] = useState<ApiRecord[]>([]);
  const [subjects, setSubjects] = useState<ApiRecord[]>([]);
  const [classes, setClasses] = useState<ApiRecord[]>([]);

  function load() {
    const fn = isStudent
      ? () => lmsApi.studentCourses(ctx.token)
      : () => lmsApi.courses(ctx.token, ctx.campusId, ctx.tier);
    fn()
      .then((c) => setCourses(c as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
    if (!isStudent) {
      Promise.all([
        teachersApi.list(ctx.token).catch(() => [] as unknown[]),
        academicApi.terms(ctx.token).catch(() => [] as unknown[]),
        academicApi.subjects(ctx.token).catch(() => [] as unknown[]),
        classesApi.list(ctx.token, ctx.campusId, ctx.tier).catch(() => [] as unknown[]),
      ]).then(([t, tr, s, c]) => {
        setTeachers(t as ApiRecord[]);
        setTerms(tr as ApiRecord[]);
        setSubjects(s as ApiRecord[]);
        setClasses(c as ApiRecord[]);
      });
    }
  }, [ctx.token, ctx.campusId, ctx.tier, isStudent]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await lmsApi.createCourse(
        ctx.token,
        {
          title,
          subjectId,
          teacherId,
          classLevelId: classLevelId || undefined,
          academicTermId,
          campusId: ctx.campusId,
          tier: ctx.tier,
          isPublished: true,
        },
        ctx.campusId,
        ctx.tier
      );
      setShowForm(false);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader
        title={isStudent ? "My courses" : "LMS courses"}
        subtitle="Connected to /api/v1/lms — assignments, live classes, gradebook"
        actions={
          !isStudent ? (
            <button type="button" className="btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "New course"}
            </button>
          ) : undefined
        }
      />
      {error && <div className="error-banner">{error}</div>}
      {showForm && (
        <form className="card" onSubmit={onCreate} style={{ marginBottom: "1rem" }}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={recordId(s)} value={recordId(s)}>
                  {String(s.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class (optional — auto-enrolls students)</label>
            <select
              value={classLevelId}
              onChange={(e) => setClassLevelId(e.target.value)}
            >
              <option value="">None</option>
              {classes.map((c) => (
                <option key={recordId(c)} value={recordId(c)}>
                  {String(c.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            >
              <option value="">Select</option>
              {teachers.map((t) => (
                <option key={recordId(t)} value={recordId(t)}>
                  {String(t.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Academic term</label>
            <select
              value={academicTermId}
              onChange={(e) => setAcademicTermId(e.target.value)}
              required
            >
              <option value="">Select term</option>
              {terms.map((t) => (
                <option key={recordId(t)} value={recordId(t)}>
                  {String(t.name)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn">
            Create
          </button>
        </form>
      )}
      <div className="grid-2">
        {courses.map((c) => (
          <Link key={recordId(c)} to={`/lms/${recordId(c)}`} className="card course-card">
            <h3>{String(c.title)}</h3>
            <p>{String((c.subject as ApiRecord)?.name ?? "Subject")}</p>
          </Link>
        ))}
      </div>
      {courses.length === 0 && <p className="empty">No courses yet</p>}
    </div>
  );
}
