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
  const [category, setCategory] = useState("lost_found");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [requests, setRequests] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBackendStatus();
    fetchRequests();
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
    const body = { category, description, location, expiry: "24" };
    setLoading(true);
    await safeFetch("http://localhost:4000/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchRequests();
    setDescription("");
    setLocation("");
  };

  const handleMatch = async (id) => {
    setLoading(true);
    const res = await safeFetch("http://localhost:4000/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    const data = await res.json();
    alert("Matches found:\n" + data.matches.map((m) => `• ${m.description} @ ${m.location}`).join("\n"));
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "sans-serif" }}>
      <h1>Mutual Match (Mock Mode)</h1>
      <p style={{ color: backendOnline ? "green" : "red" }}>
        Backend Status: {backendOnline === null ? "Checking..." : backendOnline ? "Online" : "Offline"}
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", marginBottom: 8 }}>
          <option value="lost_found">Lost & Found</option>
          <option value="missed_connections">Missed Connections</option>
          <option value="restaurant">Restaurant Openings</option>
          <option value="tickets">Tickets & Events</option>
          <option value="rideshare">Rideshare</option>
        </select>
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <button onClick={handleSubmit} disabled={loading || !backendOnline}>Submit Request</button>
      </div>

      <h2>Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        requests.map((r) => (
          <div key={r.id} style={{ borderBottom: "1px solid #ccc", padding: "8px 0" }}>
            <strong>{r.description}</strong> @ {r.location}
            <br />
            Expires: {new Date(r.expiryDate).toLocaleString()}
            <br />
            <button onClick={() => handleMatch(r.id)}>Find Matches</button>
          </div>
        ))
      )}
    </div>
  );
}
