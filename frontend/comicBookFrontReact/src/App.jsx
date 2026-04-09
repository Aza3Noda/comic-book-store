import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/comics";

// Vibrant palette cycling based on title first char
const COVER_PALETTES = [
  { accent: "#e94560", bg: "#1a0d12" },
  { accent: "#f59e0b", bg: "#1a1508" },
  { accent: "#8b5cf6", bg: "#110d1a" },
  { accent: "#10b981", bg: "#0a1a14" },
  { accent: "#3b82f6", bg: "#0a1020" },
  { accent: "#f97316", bg: "#1a1008" },
];

function ComicPlaceholder({ title, author }) {
  const idx = Math.abs((title?.charCodeAt(0) || 0)) % COVER_PALETTES.length;
  const { accent, bg } = COVER_PALETTES[idx];
  const initials = title
    ? title.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="300" fill={bg} />
      {/* Corner accents */}
      <rect x="0"   y="0"   width="200" height="6" fill={accent} />
      <rect x="0"   y="294" width="200" height="6" fill={accent} />
      <rect x="0"   y="0"   width="6"   height="300" fill={accent} />
      <rect x="194" y="0"   width="6"   height="300" fill={accent} />
      {/* Dot grid pattern */}
      {[...Array(5)].map((_, r) =>
        [...Array(4)].map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={30 + c * 48}
            cy={70 + r * 48}
            r={3}
            fill={accent}
            opacity={0.12}
          />
        ))
      )}
      {/* Diagonal stripe decoration */}
      <line x1="0"   y1="60"  x2="60"  y2="0"   stroke={accent} strokeWidth="1" opacity="0.1" />
      <line x1="0"   y1="100" x2="100" y2="0"   stroke={accent} strokeWidth="1" opacity="0.1" />
      <line x1="0"   y1="140" x2="140" y2="0"   stroke={accent} strokeWidth="1" opacity="0.07" />
      {/* Initials */}
      <text
        x="100" y="155"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="56"
        fontWeight="800"
        fill={accent}
        fontFamily="system-ui, sans-serif"
        opacity="0.9"
      >
        {initials}
      </text>
      {/* Divider */}
      <rect x="20" y="230" width="160" height="1.5" fill={accent} opacity="0.4" />
      {/* Author label */}
      <text
        x="100" y="255"
        textAnchor="middle"
        fontSize="10"
        fill={accent}
        fontFamily="system-ui, sans-serif"
        opacity="0.7"
        fontWeight="600"
        letterSpacing="2"
      >
        {(author || "UNKNOWN").toUpperCase().slice(0, 22)}
      </text>
    </svg>
  );
}

const EMPTY_FORM = {
  title: "",
  author: "",
  price: "",
  characters: "",
  pages: "",
  description: "",
  imageUrl: "",
  stock: true,
};

export default function App() {
  const [comics, setComics]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editingComic, setEditingComic] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComics = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const url = q ? `${API_URL}?search=${encodeURIComponent(q)}` : API_URL;
      const res  = await fetch(url);
      const data = await res.json();
      setComics(data);
    } catch (err) {
      console.error("Failed to fetch comics:", err);
      setComics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchComics(); }, [fetchComics]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchComics(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchComics]);

  const openAdd = () => {
    setEditingComic(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (comic) => {
    setEditingComic(comic);
    setForm({
      title:       comic.title       || "",
      author:      comic.author      || "",
      price:       comic.price       ?? "",
      characters:  comic.characters  || "",
      pages:       comic.pages       ?? "",
      description: comic.description || "",
      imageUrl:    comic.imageUrl    || "",
      stock:       comic.stock       ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingComic(null);
    setForm(EMPTY_FORM);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Fix: properly convert types before sending
    const payload = {
      ...form,
      price: parseFloat(form.price)  || 0,
      pages: parseInt(form.pages, 10) || 0,
    };
    try {
      if (editingComic) {
        await fetch(`${API_URL}/${editingComic.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
      } else {
        await fetch(API_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
      }
      closeModal();
      fetchComics(search);
    } catch (err) {
      console.error("Failed to save comic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchComics(search);
    } catch (err) {
      console.error("Failed to delete comic:", err);
    }
  };

  return (
    <div className="app">

      {/* ── Header ──────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">ComicVault</span>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                id="search-input"
                type="text"
                placeholder="Search by title or author…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            <button id="add-comic-btn" className="btn-primary" onClick={openAdd}>
              + Add Comic
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────── */}
      <main className="app-main">
        <div className="stats-bar">
          <span className="stats-count">
            {loading ? "Loading…" : `${comics.length} comic${comics.length !== 1 ? "s" : ""}`}
          </span>
          {search && !loading && (
            <span className="stats-filter">matching "{search}"</span>
          )}
        </div>

        {loading ? (
          <div className="loading-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="card-skeleton" />)}
          </div>
        ) : comics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No comics found</h2>
            <p>
              {search
                ? `No results for "${search}". Try a different search.`
                : "Your catalog is empty. Add your first comic to get started!"}
            </p>
            {!search && (
              <button className="btn-primary" onClick={openAdd}>+ Add Comic</button>
            )}
          </div>
        ) : (
          <div className="comics-grid">
            {comics.map(comic => (
              <article key={comic.id} className="comic-card">

                {/* Cover */}
                <div className="comic-cover">
                  {comic.imageUrl ? (
                    <>
                      <img
                        src={comic.imageUrl}
                        alt={comic.title}
                        onError={e => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="comic-placeholder" style={{ display: "none" }}>
                        <ComicPlaceholder title={comic.title} author={comic.author} />
                      </div>
                    </>
                  ) : (
                    <div className="comic-placeholder">
                      <ComicPlaceholder title={comic.title} author={comic.author} />
                    </div>
                  )}
                  <div className={`stock-badge ${comic.stock ? "in-stock" : "out-of-stock"}`}>
                    {comic.stock ? "● In Stock" : "○ Out of Stock"}
                  </div>
                </div>

                {/* Info */}
                <div className="comic-info">
                  <h3 className="comic-title">{comic.title}</h3>
                  <p className="comic-author">{comic.author}</p>
                  {comic.description && (
                    <p className="comic-desc">{comic.description}</p>
                  )}
                  <div className="comic-meta">
                    {comic.characters && (
                      <span className="meta-tag">👥 {comic.characters}</span>
                    )}
                    {comic.pages > 0 && (
                      <span className="meta-tag">📄 {comic.pages}p</span>
                    )}
                  </div>
                  <div className="comic-footer">
                    <span className="comic-price">€{parseFloat(comic.price).toFixed(2)}</span>
                    <div className="comic-actions">
                      <button
                        className="btn-icon btn-edit"
                        title="Edit comic"
                        onClick={() => openEdit(comic)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        title="Delete comic"
                        onClick={() => setDeleteTarget(comic)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Add / Edit Modal ─────────────────── */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingComic ? "Edit Comic" : "Add New Comic"}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-title">Title *</label>
                  <input
                    id="form-title"
                    required
                    placeholder="e.g. The Dark Knight Returns"
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-author">Author *</label>
                  <input
                    id="form-author"
                    required
                    placeholder="e.g. Frank Miller"
                    value={form.author}
                    onChange={e => setField("author", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-price">Price (€)</label>
                  <input
                    id="form-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="12.99"
                    value={form.price}
                    onChange={e => setField("price", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-pages">Pages</label>
                  <input
                    id="form-pages"
                    type="number"
                    min="0"
                    placeholder="200"
                    value={form.pages}
                    onChange={e => setField("pages", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="form-characters">Characters</label>
                <input
                  id="form-characters"
                  placeholder="e.g. Batman, Joker"
                  value={form.characters}
                  onChange={e => setField("characters", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-description">Description</label>
                <textarea
                  id="form-description"
                  placeholder="A brief synopsis…"
                  rows={3}
                  value={form.description}
                  onChange={e => setField("description", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-imageUrl">Cover Image URL</label>
                <input
                  id="form-imageUrl"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={form.imageUrl}
                  onChange={e => setField("imageUrl", e.target.value)}
                />
              </div>

              <div className="form-check">
                <input
                  id="form-stock"
                  type="checkbox"
                  checked={form.stock}
                  onChange={e => setField("stock", e.target.checked)}
                />
                <label htmlFor="form-stock">In Stock</label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : (editingComic ? "Save Changes" : "Add Comic")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────── */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Comic</h2>
            </div>
            <p>
              Are you sure you want to delete{" "}
              <strong>"{deleteTarget.title}"</strong>?
              This action cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDelete(deleteTarget.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}