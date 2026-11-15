
import { useMemo, useState } from "react";

const articles = [
    {
        category: "Getting Started",
        title: "Getting started with VERITY AI",
        steps: [
            "Sign in using your registered account.",
            "Open Workspace Settings and configure your workspace.",
            "Upload your approved brand guidelines.",
            "Open AI Review Studio to begin reviewing content."
        ]
    },
    {
        category: "Brand Intelligence",
        title: "Uploading brand guidelines",
        steps: [
            "Open Brand Intelligence.",
            "Select Upload Guidelines.",
            "Choose a PDF or DOCX file.",
            "Wait for the upload confirmation.",
            "Select the uploaded guideline when running a review."
        ]
    },
    {
        category: "AI Review Studio",
        title: "Running a content review",
        steps: [
            "Open AI Review Studio.",
            "Select an available brand guideline.",
            "Enter or paste the content you want to review.",
            "Start the analysis.",
            "Review the findings and recommendations.",
            "Use the revised content workflow where appropriate."
        ]
    },
    {
        category: "Governance",
        title: "Managing governance findings",
        steps: [
            "Open Governance Center.",
            "Review the finding severity and explanation.",
            "Inspect the recommended corrective action.",
            "Update the finding status as work progresses.",
            "Review the audit history when needed."
        ]
    },
    {
        category: "Evidence Intelligence",
        title: "Managing evidence",
        steps: [
            "Open Evidence Intelligence.",
            "Review the claims requiring evidence.",
            "Add a supporting source for each claim.",
            "Verify the evidence before treating a claim as approved."
        ]
    },
    {
        category: "Account & Security",
        title: "Protecting your account",
        steps: [
            "Use a unique, strong password.",
            "Review Active Login Sessions regularly.",
            "Revoke sessions you do not recognise.",
            "Revoke unused API keys.",
            "Export account data only to secure locations."
        ]
    }
];

export default function HelpCentre() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return articles;

        return articles.filter(article =>
            `${article.category} ${article.title} ${article.steps.join(" ")}`
                .toLowerCase()
                .includes(term)
        );
    }, [search]);

    return (
        <section className="help-centre">
            <div className="help-centre-header">
                <span className="panel-kicker">KNOWLEDGE BASE</span>
                <h2>VERITY AI Help Centre</h2>
                <p>Guides, instructions and troubleshooting for your workspace.</p>

                <input
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setSelected(null);
                    }}
                    placeholder="Search guides and instructions..."
                    aria-label="Search help articles"
                />
            </div>

            {selected ? (
                <article className="help-article">
                    <button onClick={() => setSelected(null)}>
                        ← All guides
                    </button>

                    <span className="panel-kicker">{selected.category}</span>
                    <h3>{selected.title}</h3>

                    <ol>
                        {selected.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                </article>
            ) : (
                <div className="help-article-grid">
                    {filtered.map(article => (
                        <button
                            className="help-article-card"
                            key={article.title}
                            onClick={() => setSelected(article)}
                        >
                            <span>{article.category}</span>
                            <strong>{article.title}</strong>
                            <small>{article.steps.length} steps · Read guide →</small>
                        </button>
                    ))}

                    {filtered.length === 0 && (
                        <p>No matching guides found. Try another search.</p>
                    )}
                </div>
            )}
        </section>
    );
}
