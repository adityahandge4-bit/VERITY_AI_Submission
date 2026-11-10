
const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function apiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem("variety_access_token");
    const headers = { ...(options.headers || {}) };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const isFormData =
        typeof FormData !== "undefined" &&
        options.body instanceof FormData;

    if (
        options.body != null &&
        !isFormData &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.detail || `API request failed with status ${response.status}`
        );
    }

    return data;
}

export async function getGuidelines() {
    return apiRequest("/guidelines");
}

export async function createReview(guidelineId, content) {
    return apiRequest("/review-content", {
        method: "POST",
        body: JSON.stringify({
            guideline_id: guidelineId,
            content,
        }),
    });
}

export async function getReviews() {
    return apiRequest("/reviews");
}

export async function getAnalytics() {
    return apiRequest("/analytics");
}

export async function getDatabaseStatus() {
    return apiRequest("/database-status");
}

export async function getGovernance() {
    return apiRequest("/governance");
}

export async function updateGovernanceStatus(id, status) {
    return apiRequest(`/governance/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });
}

export async function getAuditLogs() {
    return apiRequest("/audit-logs");
}
