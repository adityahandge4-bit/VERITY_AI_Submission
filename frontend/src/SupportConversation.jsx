
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function SupportConversation({ accessToken, ticketId }) {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const loadMessages = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/support/tickets/${ticketId}/messages`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Unable to load conversation.");
            }

            setMessages(data.messages || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId && accessToken) loadMessages();
    }, [ticketId, accessToken]);

    const sendMessage = async event => {
        event.preventDefault();

        if (message.trim().length < 2) return;

        setSending(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/support/tickets/${ticketId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ message: message.trim() })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Unable to send reply.");
            }

            setMessage("");
            await loadMessages();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="support-conversation">
            <div className="support-conversation-heading">
                <h3>Ticket conversation #{ticketId}</h3>
                <button type="button" onClick={loadMessages}>
                    Refresh
                </button>
            </div>

            {loading && <p>Loading conversation...</p>}
            {error && <p role="alert">{error}</p>}

            <div className="support-message-list">
                {messages.map(item => (
                    <article
                        key={item.id}
                        className={`support-message ${item.sender_role}`}
                    >
                        <strong>
                            {item.sender_role === "agent" ? "Support Team" : "You"}
                        </strong>
                        <p>{item.message}</p>
                        <small>
                            {new Date(item.created_at).toLocaleString()}
                        </small>
                    </article>
                ))}

                {!loading && messages.length === 0 && (
                    <p>No messages yet.</p>
                )}
            </div>

            <form onSubmit={sendMessage}>
                <textarea
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    placeholder="Write your reply..."
                    maxLength={5000}
                    required
                />

                <button type="submit" disabled={sending || message.trim().length < 2}>
                    {sending ? "Sending..." : "Send Reply"}
                </button>
            </form>
        </section>
    );
}
