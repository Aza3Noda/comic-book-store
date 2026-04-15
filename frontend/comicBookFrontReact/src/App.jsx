import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/comics`;
const AUTH_URL = `${API_BASE_URL}/auth/login`;
const CLOUDINARY_SIGNATURE_URL = `${API_BASE_URL}/cloudinary/signature`;
const TOKEN_STORAGE_KEY = "comicvault_admin_token";

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
      <rect x="0"   y="0"   width="200" height="6" fill={accent} />
      <rect x="0"   y="294" width="200" height="6" fill={accent} />
      <rect x="0"   y="0"   width="6"   height="300" fill={accent} />
      <rect x="194" y="0"   width="6"   height="300" fill={accent} />
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
      <line x1="0"   y1="60"  x2="60"  y2="0"   stroke={accent} strokeWidth="1" opacity="0.1" />
      <line x1="0"   y1="100" x2="100" y2="0"   stroke={accent} strokeWidth="1" opacity="0.1" />
      <line x1="0"   y1="140" x2="140" y2="0"   stroke={accent} strokeWidth="1" opacity="0.07" />
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
      <rect x="20" y="230" width="160" height="1.5" fill={accent} opacity="0.4" />
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

  // Security State
  const [isAdmin, setIsAdmin]       = useState(false);
  const [showLogin, setShowLogin]   = useState(false);
  const [token, setToken]           = useState(null);
  const [loginForm, setLoginForm]   = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [coverFile, setCoverFile]   = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (existing) {
      setToken(existing);
      setIsAdmin(true);
    }
  }, []);

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

  useEffect(() => { fetchComics(); }, [fetchComics]);

  useEffect(() => {
    const t = setTimeout(() => fetchComics(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchComics]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError("");

    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setIsAdmin(true);
        setShowLogin(false);
        setLoginForm({ username: "", password: "" });
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setLoginError("Could not connect to security server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

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
    setCoverFile(null);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadCoverToCloudinary = async () => {
    if (!coverFile) return;
    if (!token) {
      alert("Please log in as admin first.");
      return;
    }

    setUploadingCover(true);
    try {
      const sigRes = await fetch(`${CLOUDINARY_SIGNATURE_URL}?folder=comics`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!sigRes.ok) {
        throw new Error("Could not get upload signature from backend.");
      }
      const sig = await sigRes.json();

      const formData = new FormData();
      formData.append("file", coverFile);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("folder", sig.folder);
      formData.append("signature", sig.signature);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
      const upRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok) {
        throw new Error(upData?.error?.message || "Cloudinary upload failed.");
      }

      setField("imageUrl", upData.secure_url);
      setCoverFile(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    const payload = {
      ...form,
      price: parseFloat(form.price)  || 0,
      pages: parseInt(form.pages, 10) || 0,
    };
    try {
      const config = {
        method:  editingComic ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      };
      
      const url = editingComic ? `${API_URL}/${editingComic.id}` : API_URL;
      const res = await fetch(url, config);
      
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        alert("Session expired. Please log in again.");
      } else {
        closeModal();
        fetchComics(search);
      }
    } catch (err) {
      console.error("Failed to save comic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        alert("Session expired. Please log in again.");
      } else {
        setDeleteTarget(null);
        fetchComics(search);
      }
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
                placeholder="Search catalog…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            {isAdmin ? (
              <button id="add-comic-btn" className="btn-primary" onClick={openAdd}>
                + Add Comic
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => setShowLogin(true)}>
                🔑 Admin
              </button>
            )}
            {isAdmin && (
              <button className="btn-icon" title="Logout" onClick={handleLogout}>🚪</button>
            )}
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
                : "Your catalog is empty."}
            </p>
            {!search && isAdmin && (
              <button className="btn-primary" onClick={openAdd}>+ Add Comic</button>
            )}
          </div>
        ) : (
          <div className="comics-grid">
            {comics.map(comic => (
              <article key={comic.id} className="comic-card">
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
                      <a 
                        href={`https://wa.me/5352946335?text=${encodeURIComponent(
                          `Hello! I'm interested in buying "${comic.title}" for €${parseFloat(comic.price).toFixed(2)}.`
                        )}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-buy"
                      >
                        Buy Now
                      </a>
                      {isAdmin && (
                        <div className="admin-actions">
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
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Login Modal ─────────────────────── */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal modal-login" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Admin Login</h2>
              <button className="modal-close" onClick={() => setShowLogin(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleLogin}>
              {loginError && <div className="error-alert">{loginError}</div>}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Verifying..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────── */}
      {isAdmin && showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingComic ? "Edit Comic" : "Add New Comic"}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    required
                    value={form.author}
                    onChange={e => setField("author", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (€)</label>
                  <input
                    type="number" step="0.01"
                    value={form.price}
                    onChange={e => setField("price", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Pages</label>
                  <input
                    type="number"
                    value={form.pages}
                    onChange={e => setField("pages", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Characters</label>
                <input
                  value={form.characters}
                  onChange={e => setField("characters", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setField("description", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Cover Image</label>
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setCoverFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={uploadCoverToCloudinary}
                    disabled={!coverFile || uploadingCover}
                  >
                    {uploadingCover ? "Uploading..." : "Upload to Cloudinary"}
                  </button>
                  <input
                    type="url"
                    placeholder="...or paste an image URL"
                    value={form.imageUrl}
                    onChange={e => setField("imageUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  checked={form.stock}
                  onChange={e => setField("stock", e.target.checked)}
                />
                <label>In Stock</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : (editingComic ? "Save Changes" : "Add Comic")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────── */}
      {isAdmin && deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Delete Comic</h2></div>
            <p>Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?</p>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteTarget.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}