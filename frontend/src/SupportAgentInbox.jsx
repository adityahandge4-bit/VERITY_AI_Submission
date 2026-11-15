
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function SupportAgentInbox({ accessToken }) {
    const [tickets, setTickets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState("");
    const [status, setStatus] = useState("IN_PROGRESS");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
    };

    const loadTickets = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API}/support/agent/tickets`, {
                headers
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || "Unable to load tickets.");

            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openTicket = async ticket => {
        setSelected(ticket);
        setStatus(ticket.status);

        try {
            const response = await fetch(
                `${API}/support/agent/tickets/${ticket.id}/messages`,
                { headers }
            );
            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || "Unable to load messages.");

            setMessages(data.messages || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const sendReply = async event => {
        event.preventDefault();
        if (!selected || reply.trim().length < 2) return;

        try {
            const response = await fetch(
                `${API}/support/agent/tickets/${selected.id}/reply`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ message: reply.trim() })
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || "Reply failed.");

            setReply("");
            await openTicket(selected);
            await loadTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const updateStatus = async () => {
        if (!selected) return;

        try {
            const response = await fetch(
                `${API}/support/agent/tickets/${selected.id}/status?status=${encodeURIComponent(status)}`,
                { method: "PATCH", headers }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || "Status update failed.");

            setSelected({ ...selected, status });
            await loadTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (accessToken) loadTickets();
    }, [accessToken]);

    return (
        <section className="support-agent-inbox">
            <header>
                <span className="panel-kicker">SUPPORT OPERATIONS</span>
                <h2>Support Agent Inbox</h2>
                <button onClick={loadTickets} disabled={loading}>
                    {loading ? "Loading..." : "Refresh tickets"}
                </button>
            </header>

            {error && <p role="alert">{error}</p>}

            <div className="support-agent-layout">
                <div className="support-agent-ticket-list">
                    {tickets.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => openTicket(ticket)}
                            className={selected?.id === ticket.id ? "selected" : ""}
                        >
                            <strong>#{ticket.id} · {ticket.subject}</strong>
                            <span>{ticket.customer_name} · {ticket.status}</span>
                        </button>
                    ))}
                </div>

                {selected && (
                    <div className="support-agent-detail">
                        <h3>{selected.subject}</h3>
                        <p>{selected.customer_email}</p>

                        <div className="support-message-list">
                            {messages.map(item => (
                                <article className={`support-message ${item.sender_role}`} key={item.id}>
                                    <strong>{item.sender_role === "agent" ? "Support Team" : "Customer"}</strong>
                                    <p>{item.message}</p>
                                    <small>{new Date(item.created_at).toLocaleString()}</small>
                                </article>
                            ))}
                        </div>

                        <form onSubmit={sendReply}>
                            <textarea
                                value={reply}
                                onChange={event => setReply(event.target.value)}
                                placeholder="Reply to customer..."
                                maxLength={5000}
                                required
                            />
                            <button type="submit">Send Agent Reply</button>
                        </form>

                        <div className="support-agent-status">
                            <select value={status} onChange={event => setStatus(event.target.value)}>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                            <button onClick={updateStatus}>Update Status</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
