import { FormEvent, useEffect, useState } from "react";
import { libraryApi, studentsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function LibraryPage() {
  const ctx = useApiContext();
  const [books, setBooks] = useState<ApiRecord[]>([]);
  const [loans, setLoans] = useState<ApiRecord[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [students, setStudents] = useState<ApiRecord[]>([]);
  const [borrowBookId, setBorrowBookId] = useState("");
  const [borrowStudentId, setBorrowStudentId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      libraryApi.books(ctx.token, undefined, ctx.campusId, ctx.tier),
      libraryApi.loans(ctx.token, { active: "true" }, ctx.campusId, ctx.tier),
    ])
      .then(([b, l]) => {
        setBooks(b as ApiRecord[]);
        setLoans(l as ApiRecord[]);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
    studentsApi.list(ctx.token, ctx.campusId, ctx.tier).then((s) => {
      setStudents(s as ApiRecord[]);
      if (s[0]) setBorrowStudentId(recordId(s[0] as ApiRecord));
    });
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function addBook(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await libraryApi.createBook(
        ctx.token,
        { title, author, campusId: ctx.campusId },
        ctx.campusId,
        ctx.tier
      );
      setTitle("");
      setAuthor("");
      setMsg("Book added.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function borrowBook(e: FormEvent) {
    e.preventDefault();
    try {
      await libraryApi.borrow(
        ctx.token,
        { bookId: borrowBookId, studentId: borrowStudentId },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Book loaned.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function returnLoan(loanId: string) {
    try {
      await libraryApi.returnLoan(ctx.token, loanId, ctx.campusId, ctx.tier);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Library</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        <form className="card" onSubmit={borrowBook} style={{ marginBottom: "1rem" }}>
          <h3>Issue loan (OPAC)</h3>
          <div className="form-group">
            <label>Book</label>
            <select value={borrowBookId} onChange={(e) => setBorrowBookId(e.target.value)} required>
              <option value="">Select book</option>
              {books.map((b) => (
                <option key={recordId(b)} value={recordId(b)}>
                  {String(b.title)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Student</label>
            <select value={borrowStudentId} onChange={(e) => setBorrowStudentId(e.target.value)} required>
              {students.map((s) => (
                <option key={recordId(s)} value={recordId(s)}>
                  {String(s.name)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            Borrow
          </button>
        </form>
        <form className="card" onSubmit={addBook}>
          <h3>Add book</h3>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <button type="submit" className="btn">
            Save
          </button>
        </form>
        <div className="card table-wrap">
          <h3>Catalog ({books.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={recordId(b)}>
                  <td>{String(b.title)}</td>
                  <td>
                    {String(b.available)}/{String(b.copies)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <h3>Active loans</h3>
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Student</th>
              <th>Due</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={recordId(l)}>
                <td>{String(l.bookTitle)}</td>
                <td>{String(l.studentName)}</td>
                <td>{String(l.dueAt ?? "").slice(0, 10)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => returnLoan(recordId(l))}
                  >
                    Return
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loans.length === 0 && <p className="empty">No active loans</p>}
      </div>
    </div>
  );
}
