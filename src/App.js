import React, { useState, useEffect } from "react";

// MOCK MODE FOR TESTING
const MOCK_MODE = true;

const mockFetch = (url, options = {}) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  return delay(300).then(() => {
    if (url.endsWith("/requests")) {
      if (options.method === "POST" || options.method === "PUT") {
        return { ok: true, json: () => Promise.resolve({ status: "success" }) };
      } else if (options.method === "DELETE") {
        return { ok: true };
      }
      return {
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "1",
              category: "lost_found",
              description: "Lost wallet",
              location: "NYC",
              expiryDate: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
          ]),
      };
    } else if (url.endsWith("/user")) {
      return { ok: true, json: () => Promise.resolve({ phone: "555-1234" }) };
    } else if (url.endsWith("/match")) {
      return {
        ok: true,
        json: () =>
          Promise.resolve({
            matches: [
              { description: "Found wallet", location: "NYC" },
              { description: "Wallet spotted", location: "Brooklyn" },
            ],
          }),
      };
    }
    return { ok: false };
  });
};

const safeFetch = (url, options) => (MOCK_MODE ? mockFetch(url, options) : fetch(url, options));

export default function App() {
  const [requests, setRequests] = useState([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("lost_found");
  const [expiry, setExpiry] = useState("24");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBackendStatus();
    fetchRequests();
    const interval = setInterval(checkBackendStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    setLoading(true);
    try {
      const res = await safeFetch("http://localhost:4000/requests");
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await safeFetch("http://localhost:4000/requests");
      const data = await res.json();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const body = { category, description, location, expiry };
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:4000/requests/${editingId}`
      : "http://localhost:4000/requests";

    setLoading(true);
    await safeFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchRequests();
    setDescription("");
    setLocation("");
    setCategory("lost_found");
    setExpiry("24");
    setEditingId(null);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    setLoading(true);
    await safeFetch(`http://localhost:4000/requests/${id}`, { method: "DELETE" });
    await fetchRequests();
    setLoading(false);
  };

  const handleEdit = (req) => {
    setCategory(req.category);
    setDescription(req.description);
    setLocation(req.location);
    setExpiry("24");
    setEditingId(req.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMatch = async (id) => {
    setLoading(true);
    const res = await safeFetch("http://localhost:4000/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    const data = await res.json();
    alert(
      "Matches found:\n" +
        data.matches.map((m) => `• ${m.description} @ ${m.location}`).join("\n")
    );
    setLoading(false);
  };

  const filtered = requests
    .filter(
      (r) =>
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 600, margin: "auto" }}>
      <h1>Mutual Match (Mock Mode)</h1>
      <p style={{ color: backendOnline ? "green" : "red" }}>
        Backend: {backendOnline === null ? "Checking..." : backendOnline ? "Online" : "Offline"}
      </p>

      <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", marginBottom: 8 }}>
        <option value="lost_found">Lost_
