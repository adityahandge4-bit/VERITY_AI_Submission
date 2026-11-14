import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");




const navItems = [
  { id: "dashboard", label: "Command Center", icon: "◈" },
  { id: "brand", label: "Brand Intelligence", icon: "✦" },
  { id: "review", label: "AI Review Studio", icon: "◇" },
  { id: "evidence", label: "Evidence Intelligence", icon: "◎" },
  { id: "drift", label: "Brand Health", icon: "◌" },
  { id: "governance", label: "Governance Center", icon: "◆" },
  {
    id: "history",
    label: "Review History",
    icon: "↺",
  }
];

const reviews = [
  {
    title: "Product launch announcement",
    type: "Marketing",
    score: 96,
    status: "Compliant",
    time: "12 min ago",
  },
  {
    title: "Healthcare campaign copy",
    type: "Campaign",
    score: 84,
    status: "Review needed",
    time: "48 min ago",
  },
  {
    title: "Enterprise landing page",
    type: "Web",
    score: 91,
    status: "Compliant",
    time: "2 hrs ago",
  },
];

const brandDNA = [
  {
    icon: "◉",
    title: "Voice DNA",
    value: "Confident",
    description: "Clear, authoritative and human.",
    score: 94,
  },
  {
    icon: "Aa",
    title: "Language DNA",
    value: "Precise",
    description: "Simple language with strong intent.",
    score: 91,
  },
  {
    icon: "✓",
    title: "Fact DNA",
    value: "Verified",
    description: "Evidence-backed brand statements.",
    score: 97,
  },
  {
    icon: "◇",
    title: "Claim DNA",
    value: "Controlled",
    description: "Claims remain within approved boundaries.",
    score: 89,
  },
  {
    icon: "✧",
    title: "Visual DNA",
    value: "Premium",
    description: "Consistent visual identity and hierarchy.",
    score: 93,
  },
  {
    icon: "⊙",
    title: "Accessibility DNA",
    value: "Strong",
    description: "Readable and inclusive content patterns.",
    score: 95,
  },
];

const DEFAULT_EVIDENCE_ITEMS = [
  {
    id: 1,
    claim: "Clinical performance claim",
    status: "Verified",
    score: 98,
    source: "Approved brand evidence",
  },
  {
    id: 2,
    claim: "Customer satisfaction claim",
    status: "Verified",
    score: 94,
    source: "Customer research",
  },
  {
    id: 3,
    claim: "Market leadership claim",
    status: "Review",
    score: 72,
    source: "Evidence required",
  },
  {
    id: 4,
    claim: "Product capability claim",
    status: "Verified",
    score: 96,
    source: "Product documentation",
  },
  {
    id: 5,
    claim: "Security statement",
    status: "Verified",
    score: 99,
    source: "Security documentation",
  },
];

const DEFAULT_HEALTH_HISTORY = [
  {
    id: 1,
    score: 88,
    claimScore: 86,
    evidenceScore: 92,
    voiceScore: 94,
    status: "STABLE",
    source: "Baseline",
    timestamp: "2026-01-01T10:00:00",
  },
  {
    id: 2,
    score: 89,
    claimScore: 87,
    evidenceScore: 93,
    voiceScore: 94,
    status: "STABLE",
    source: "Baseline",
    timestamp: "2026-02-01T10:00:00",
  },
  {
    id: 3,
    score: 91,
    claimScore: 90,
    evidenceScore: 95,
    voiceScore: 95,
    status: "STABLE",
    source: "Baseline",
    timestamp: "2026-03-01T10:00:00",
  },
  {
    id: 4,
    score: 92,
    claimScore: 89,
    evidenceScore: 97,
    voiceScore: 94,
    status: "STABLE",
    source: "Current baseline",
    timestamp: "2026-04-01T10:00:00",
  },
];

const DEFAULT_GOVERNANCE_ITEMS = [
  {
    id: "gov-demo-1",
    findingId: "demo-finding-1",
    title: "Market leadership claim requires validation",
    category: "Claims",
    severity: "high",
    detectedText: "We are the market leader in our category.",
    explanation:
      "The claim requires stronger supporting evidence before publication.",
    recommendation:
      "Validate the claim against approved market research or revise the wording.",
    status: "OPEN",
    source: "Governance baseline",
    guidelineFilename: "Approved Brand Guidelines",
    createdAt: "2026-04-01T10:00:00",
    updatedAt: "2026-04-01T10:00:00",
  },
  {
    id: "gov-demo-2",
    findingId: "demo-finding-2",
    title: "Absolute performance statement requires review",
    category: "Messaging",
    severity: "medium",
    detectedText: "Our solution always delivers perfect results.",
    explanation:
      "Absolute language can create an unsupported or overly broad brand claim.",
    recommendation:
      "Replace absolute language with a qualified, evidence-backed statement.",
    status: "IN REVIEW",
    source: "Governance baseline",
    guidelineFilename: "Approved Brand Guidelines",
    createdAt: "2026-04-02T10:00:00",
    updatedAt: "2026-04-02T10:00:00",
  },
];

const DEFAULT_GOVERNANCE_ACTIVITY = [
  {
    id: "activity-1",
    action: "Governance Center initialized",
    detail: "Baseline governance items were loaded.",
    timestamp: "2026-04-01T10:00:00",
    type: "system",
  },
  {
    id: "activity-2",
    action: "Finding moved to In Review",
    detail: "A medium-severity messaging finding entered review.",
    timestamp: "2026-04-02T10:00:00",
    type: "review",
  },
];

function ScoreRing({ score = 92, size = 210 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200">
        <circle className="ring-track" cx="100" cy="100" r={radius} />
        <circle
          className="ring-progress"
          cx="100"
          cy="100"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>

      <div className="score-content">
        <span className="score-number">{safeScore}</span>
        <span className="score-total">/100</span>
        <span className="score-label">Brand Trust</span>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function overallHealthAlertCount(alerts) {
  return alerts.filter(
    (alert) => alert.type === "risk" || alert.type === "watch"
  ).length;
}

function App() {
  const [accessToken, setAccessToken] = useState(
    () => sessionStorage.getItem("variety_access_token") || ""
  );
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // PROFILE SETTINGS
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  // PASSWORD & LOGIN SECURITY
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  // ACTIVE LOGIN SESSIONS
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsMessage, setSessionsMessage] = useState("");
  const [revokingSessions, setRevokingSessions] = useState(false);

  const passwordStrengthScore = [
    newPassword.length >= 12,
    /[a-z]/.test(newPassword),
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ].filter(Boolean).length;

  const passwordStrengthLabel =
    !newPassword
      ? ""
      : passwordStrengthScore <= 2
        ? "Weak"
        : passwordStrengthScore <= 4
          ? "Moderate"
          : "Strong";


  const defaultPreferences = {
    in_app_enabled: true,
    email_enabled: false,
    browser_enabled: false,
    review_alerts: true,
    evidence_alerts: true,
    security_alerts: true,
    product_updates: false,
  };
  const [notificationPreferences, setNotificationPreferences] = useState({
    in_app_enabled: true,
    email_enabled: false,
    browser_enabled: false,
    review_alerts: true,
    evidence_alerts: true,
    security_alerts: true,
    product_updates: false,
  });

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || "");
      setProfileEmail(currentUser.email || "");
      setProfileError("");
    }
  }, [currentUser]);
  useEffect(() => {
    if (!profileSuccess) return;

    const timer = setTimeout(() => {
      setProfileSuccess("");
    }, 30000);

    return () => clearTimeout(timer);
  }, [profileSuccess]);

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");

  const [guidelines, setGuidelines] = useState([]);
  const [selectedGuideline, setSelectedGuideline] = useState("");
  const [reviewResult, setReviewResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendReviews, setBackendReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [backendGovernance, setBackendGovernance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [revisedContent, setRevisedContent] =
    useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [analyticsRange, setAnalyticsRange] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loadNotifications = async () => {
    if (!accessToken) return;

    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/notifications?limit=50`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),

        fetch(`${API_BASE_URL}/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      if (!notificationsResponse.ok || !unreadResponse.ok) {
        throw new Error("Unable to load notifications");
      }

      const notificationsData = await notificationsResponse.json();
      const unreadData = await unreadResponse.json();

      setNotifications(
        Array.isArray(notificationsData)
          ? notificationsData
          : notificationsData.notifications || []
      );

      setUnreadNotificationCount(
        unreadData.unread_count ?? 0
      );

    } catch (error) {
      console.error("Notifications loading error:", error);
    }
  };
  const loadNotificationPreferences = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notification-preferences`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load notification preferences");
      }

      const preferences = await response.json();

      setNotificationPreferences(preferences);
    } catch (error) {
      console.error(
        "Notification preferences loading error:",
        error
      );
    }
  };
  const saveNotificationPreferences = async (preferences) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notification-preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to save notification preferences");
      }

      const data = await response.json();

      console.log(data.message);
    } catch (error) {
      console.error(
        "Notification preferences saving error:",
        error
      );

      alert("Unable to save notification preferences. Please try again.");
    }
  };
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark notification as read");
      }

      await loadNotifications();
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark all notifications as read");
      }

      await loadNotifications();
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  };
  const loadBackendData = async () => {
    setBackendLoading(true);
    setBackendError("");


    const fetchJson = async (path) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `Request failed: ${path} (${response.status})`
        );
      }

      return data;
    };


    const results = await Promise.allSettled([
      fetchJson("/reviews"),
      fetchJson("/analytics"),
      fetchJson("/governance"),
      fetchJson("/audit-logs"),
    ]);

    const errors = [];

    if (results[0].status === "fulfilled") {
      setBackendReviews(results[0].value.reviews || []);
    } else {
      errors.push(`Reviews: ${results[0].reason?.message || "Unable to load"}`);
    }

    if (results[1].status === "fulfilled") {
      setAnalytics(results[1].value || null);
    } else {
      errors.push(`Analytics: ${results[1].reason?.message || "Unable to load"}`);
    }

    if (results[2].status === "fulfilled") {
      setBackendGovernance(results[2].value.items || []);
    } else {
      errors.push(`Governance: ${results[2].reason?.message || "Unable to load"}`);
    }

    if (results[3].status === "fulfilled") {
      setAuditLogs(results[3].value.logs || []);
    } else {
      errors.push(`Audit logs: ${results[3].reason?.message || "Unable to load"}`);
    }

    if (errors.length) {
      setBackendError(errors.join(" | "));
      console.error("Some VARIETY AI backend data could not be loaded:", errors);
    }

    setBackendLoading(false);
  };
  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthError("");
    setRegisterMessage("");
    setRegisterLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed. Please try again."
        );
      }

      setLoginEmail(registerEmail.trim());
      setLoginPassword("");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterMessage(data.message || "Account created. Please sign in.");
      setShowRegister(false);
    } catch (error) {
      setAuthError(error.message || "Unable to create account.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError("");
    setLoginLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail.trim());
      formData.append("password", loginPassword);

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed. Check your email and password."
        );
      }

      sessionStorage.setItem("variety_access_token", data.access_token);
      setAccessToken(data.access_token);

      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = await userResponse.json().catch(() => ({}));

      if (!userResponse.ok) {
        sessionStorage.removeItem("variety_access_token");
        setAccessToken("");
        throw new Error("Login succeeded, but user verification failed.");
      }

      setCurrentUser(userData);
      setLoginPassword("");
    } catch (error) {
      setAuthError(error.message || "Unable to log in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Backend logout error:", error);
    } finally {
      sessionStorage.removeItem("variety_access_token");
      setAccessToken("");
      setCurrentUser(null);
      setLoginEmail("");
      setLoginPassword("");
      setAuthError("");
      setActiveSessions([]);
    }
  };

  const loadActiveSessions = async () => {
    if (!accessToken) return;

    setSessionsLoading(true);
    setSessionsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load active sessions.");
      }

      setActiveSessions(data.sessions || []);
    } catch (error) {
      setSessionsError(error.message || "Unable to load active sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      "Are you sure you want to sign out all other active sessions?"
    );

    if (!confirmed) return;

    setRevokingSessions(true);
    setSessionsError("");
    setSessionsMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/sessions/revoke-others`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to revoke other sessions.");
      }

      setSessionsMessage(
        data.message || "Other sessions have been signed out."
      );

      await loadActiveSessions();
    } catch (error) {
      setSessionsError(error.message || "Unable to revoke other sessions.");
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileError("");
    setProfileSuccess("");

    const name = profileName.trim();
    const email = profileEmail.trim();

    if (!name || !email) {
      setProfileError("Name and email are required.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update your profile."
        );
      }

      setCurrentUser(data);
      setProfileName(data.name || "");
      setProfileEmail(data.email || "");

      // Display confirmation after successful saving
      setProfileSuccess("Your profile was updated successfully.");
    } catch (error) {
      setProfileError(
        error.message || "Something went wrong while saving."
      );
    } finally {
      setProfileSaving(false);
    }
  };


  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError(
        "Your new password must contain at least 12 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Your new passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to change your password."
        );
      }

      setPasswordSuccess(
        data.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      setPasswordError(
        error.message || "Something went wrong while changing your password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const [reviewHistory, setReviewHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("variety_review_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [evidenceItems, setEvidenceItems] = useState(() => {
    try {
      const saved = localStorage.getItem("variety_evidence_items");
      return saved ? JSON.parse(saved) : DEFAULT_EVIDENCE_ITEMS;
    } catch (error) {
      console.error("Unable to load evidence data:", error);
      return DEFAULT_EVIDENCE_ITEMS;
    }
  });

  const [newEvidenceClaim, setNewEvidenceClaim] = useState("");
  const [newEvidenceSource, setNewEvidenceSource] = useState("");

  const [healthHistory, setHealthHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("variety_brand_health_history");
      return saved ? JSON.parse(saved) : DEFAULT_HEALTH_HISTORY;
    } catch (error) {
      console.error("Unable to load brand health history:", error);
      return DEFAULT_HEALTH_HISTORY;
    }
  });

  const [healthAlerts, setHealthAlerts] = useState([]);

  /* ============================================================
     STAGE 9 — GOVERNANCE STATE
  ============================================================ */

  const [governanceItems, setGovernanceItems] = useState(() => {
    try {
      const saved = localStorage.getItem("variety_governance_items");
      return saved ? JSON.parse(saved) : DEFAULT_GOVERNANCE_ITEMS;
    } catch (error) {
      console.error("Unable to load governance data:", error);
      return DEFAULT_GOVERNANCE_ITEMS;
    }
  });

  const [governanceActivity, setGovernanceActivity] = useState(() => {
    try {
      const saved = localStorage.getItem("variety_governance_activity");
      return saved
        ? JSON.parse(saved)
        : DEFAULT_GOVERNANCE_ACTIVITY;
    } catch (error) {
      console.error("Unable to load governance activity:", error);
      return DEFAULT_GOVERNANCE_ACTIVITY;
    }
  });

  /* ============================================================
     PERSISTENCE
  ============================================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        "variety_review_history",
        JSON.stringify(reviewHistory)
      );
    } catch (error) {
      console.error("Unable to save review history:", error);
    }
  }, [reviewHistory]);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (!accessToken) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          sessionStorage.removeItem("variety_access_token");
          if (!cancelled) {
            setAccessToken("");
            setCurrentUser(null);
          }
          return;
        }

        if (!cancelled) {
          setCurrentUser(data);
        }
      } catch {
        if (!cancelled) {
          setAuthError("Cannot connect to the backend. Check that FastAPI is running.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && currentUser) {
      loadBackendData();
      loadNotifications();
      loadNotificationPreferences();
      loadActiveSessions();
    } else {
      setNotifications([]);
      setUnreadNotificationCount(0);
      setActiveSessions([]);
    }
  }, [accessToken, currentUser]);

  // Automatically refresh notifications every 30 seconds

  useEffect(() => {
    if (!accessToken || !currentUser) {
      return;
    }

    const notificationInterval = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(notificationInterval);
    };
  }, [accessToken, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "variety_evidence_items",
        JSON.stringify(evidenceItems)
      );
    } catch (error) {
      console.error("Unable to save evidence data:", error);
    }
  }, [evidenceItems]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "variety_brand_health_history",
        JSON.stringify(healthHistory)
      );
    } catch (error) {
      console.error("Unable to save brand health history:", error);
    }
  }, [healthHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "variety_governance_items",
        JSON.stringify(governanceItems)
      );
    } catch (error) {
      console.error("Unable to save governance data:", error);
    }
  }, [governanceItems]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "variety_governance_activity",
        JSON.stringify(governanceActivity)
      );
    } catch (error) {
      console.error("Unable to save governance activity:", error);
    }
  }, [governanceActivity]);

  /* ============================================================
     LOAD GUIDELINES
  ============================================================ */

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/guidelines`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load guidelines");
        }

        const data = await response.json();
        const loadedGuidelines = data.guidelines || [];

        setGuidelines(loadedGuidelines);

        if (loadedGuidelines.length > 0) {
          setSelectedGuideline(String(loadedGuidelines[0].id));
        }
      } catch (error) {
        console.error("Unable to load guidelines:", error);
      }
    };

    loadGuidelines();
  }, []);

  /* ============================================================
     GUIDELINE UPLOAD
  ============================================================ */

  const uploadGuideline = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadMessage("");
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/upload-guidelines`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("variety_access_token")}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to upload the guideline."
        );
      }

      setUploadMessage(
        `${data.filename} uploaded successfully.`
      );

      const guidelinesResponse = await fetch(
        `${API_BASE_URL}/guidelines`
      );

      if (!guidelinesResponse.ok) {
        throw new Error(
          "Guideline uploaded, but list could not be refreshed."
        );
      }

      const guidelinesData =
        await guidelinesResponse.json();

      const updatedGuidelines =
        guidelinesData.guidelines || [];

      setGuidelines(updatedGuidelines);

      if (data.guideline_id) {
        setSelectedGuideline(
          String(data.guideline_id)
        );
      }
    } catch (error) {
      console.error("Guideline upload error:", error);

      setUploadError(
        error.message ||
        "Unable to upload the guideline."
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* ============================================================
     EVIDENCE INTELLIGENCE
  ============================================================ */

  const addEvidenceItem = () => {
    if (!newEvidenceClaim.trim()) return;

    const newItem = {
      id: Date.now(),
      claim: newEvidenceClaim.trim(),
      status: "Review",
      score: 60,
      source:
        newEvidenceSource.trim() ||
        "Evidence required",
    };

    setEvidenceItems((previous) => [
      newItem,
      ...previous,
    ]);

    setNewEvidenceClaim("");
    setNewEvidenceSource("");
  };

  const updateEvidenceStatus = (id, status) => {
    setEvidenceItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          status,
          score:
            status === "Verified"
              ? Math.max(
                Number(item.score) || 0,
                90
              )
              : Math.min(
                Number(item.score) || 0,
                79
              ),
        };
      })
    );
  };

  const removeEvidenceItem = (id) => {
    setEvidenceItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  /* ============================================================
     STAGE 9 — GOVERNANCE ACTIVITY
  ============================================================ */

  const addGovernanceActivity = (
    action,
    detail,
    type = "workflow"
  ) => {
    const activity = {
      id: `activity-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      action,
      detail,
      timestamp: new Date().toISOString(),
      type,
    };

    setGovernanceActivity((previous) =>
      [activity, ...previous].slice(0, 50)
    );
  };

  function createRevision(finding) {

    setRevisedContent(
      content.replace(
        finding.detected_text,
        finding.suggestion
      )
    );
  }

  /* ============================================================
     STAGE 9 — CREATE GOVERNANCE ITEM
  ============================================================ */

  const createGovernanceFromFinding = (
    finding,
    reviewData = reviewResult
  ) => {
    if (!finding) return;

    const detectedText =
      finding.detected_text ||
      finding.matched_text ||
      finding.detected_language ||
      finding.text ||
      finding.pattern ||
      "Detected brand issue";

    const title =
      finding.title ||
      finding.name ||
      finding.rule_name ||
      "Brand governance finding";

    const severity = String(
      finding.severity || "medium"
    ).toLowerCase();

    const normalizedSeverity =
      ["high", "medium", "low"].includes(severity)
        ? severity
        : "medium";

    const findingKey =
      `${title}|${detectedText}`.toLowerCase();

    setGovernanceItems((previous) => {
      const exists = previous.some(
        (item) =>
          `${item.title}|${item.detectedText}`
            .toLowerCase() === findingKey &&
          item.status !== "RESOLVED"
      );

      if (exists) {
        return previous;
      }

      const newGovernanceItem = {
        id: `gov-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

        findingId:
          finding.id ||
          finding.rule_id ||
          `finding-${Date.now()}`,

        title,
        category:
          finding.category ||
          "Brand Compliance",

        severity: normalizedSeverity,

        detectedText,

        explanation:
          finding.explanation ||
          finding.reason ||
          finding.why_flagged ||
          "This content requires governance review.",

        recommendation:
          finding.suggestion ||
          finding.recommended_action ||
          finding.recommendation ||
          "Review and revise the content before publication.",

        status: "OPEN",

        source: "AI Review",

        guidelineFilename:
          reviewData?.guideline_filename ||
          "Selected brand guideline",

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      };

      return [
        newGovernanceItem,
        ...previous,
      ];
    });

    addGovernanceActivity(
      "New AI finding added to governance",
      `${title} entered the governance decision queue.`,
      "finding"
    );
  };

  const createGovernanceItemsFromReview = (
    result
  ) => {
    const findings = result?.findings || [];

    findings.forEach((finding) => {
      createGovernanceFromFinding(
        finding,
        result
      );
    });
  };

  /* ============================================================
     STAGE 9 — GOVERNANCE WORKFLOW
  ============================================================ */

  const updateGovernanceStatus = (
    id,
    status
  ) => {
    const item = governanceItems.find(
      (entry) => entry.id === id
    );

    if (!item) return;

    setGovernanceItems((previous) =>
      previous.map((entry) => {
        if (entry.id !== id) return entry;

        return {
          ...entry,
          status,
          updatedAt:
            new Date().toISOString(),
        };
      })
    );

    const actionMap = {
      "IN REVIEW":
        "Finding moved to In Review",
      APPROVED:
        "Governance decision approved",
      REJECTED:
        "Governance decision rejected",
      RESOLVED:
        "Governance finding resolved",
      OPEN:
        "Governance finding reopened",
    };

    addGovernanceActivity(
      actionMap[status] ||
      "Governance status updated",
      `${item.title} is now ${status}.`,
      status === "APPROVED"
        ? "approved"
        : status === "REJECTED"
          ? "rejected"
          : status === "RESOLVED"
            ? "resolved"
            : "workflow"
    );
  };

  const removeGovernanceItem = (id) => {
    const item = governanceItems.find(
      (entry) => entry.id === id
    );

    if (!item) return;

    setGovernanceItems((previous) =>
      previous.filter(
        (entry) => entry.id !== id
      )
    );

    addGovernanceActivity(
      "Governance item removed",
      `${item.title} was removed from the decision queue.`,
      "system"
    );
  };

  /* ============================================================
       EVIDENCE → GOVERNANCE CONNECTION
    ============================================================ */

  const createEvidenceFromFinding = (
    finding
  ) => {
    const detectedText =
      finding.detected_text ||
      finding.matched_text ||
      finding.detected_language ||
      finding.text ||
      finding.pattern ||
      "Detected brand claim";

    if (
      evidenceItems.some(
        (item) =>
          item.claim === detectedText
      )
    ) {
      createGovernanceFromFinding(
        finding
      );

      setActivePage("evidence");
      return;
    }

    const severity = String(
      finding.severity || "medium"
    ).toLowerCase();

    const score =
      severity === "high"
        ? 45
        : severity === "medium"
          ? 65
          : 80;

    const newItem = {
      id: Date.now(),
      claim: detectedText,
      status: "Review",
      score,
      source:
        "Generated from AI Review finding",
    };

    setEvidenceItems((previous) => [
      newItem,
      ...previous,
    ]);

    createGovernanceFromFinding(
      finding
    );

    addGovernanceActivity(
      "Evidence check created from AI finding",
      `${detectedText} was added to Evidence Intelligence and Governance.`,
      "evidence"
    );

    setActivePage("evidence");
  };

  /* ============================================================
     BRAND HEALTH
  ============================================================ */

  const calculateReviewHealth = (
    result
  ) => {
    if (!result) {
      return {
        score: 92,
        claimScore: 89,
        evidenceScore: 92,
        voiceScore: 94,
        status: "STABLE",
      };
    }

    const riskSummary =
      result.risk_summary || {};

    const high = Number(
      riskSummary.high || 0
    );

    const medium = Number(
      riskSummary.medium || 0
    );

    const low = Number(
      riskSummary.low || 0
    );

    const claimScore = Math.max(
      35,
      Math.min(
        100,
        100 -
        high * 18 -
        medium * 8 -
        low * 2
      )
    );

    const evidenceScore =
      evidenceItems.length > 0
        ? Math.round(
          evidenceItems.reduce(
            (total, item) =>
              total +
              Number(
                item.score || 0
              ),
            0
          ) /
          evidenceItems.length
        )
        : 92;

    const voiceScore =
      result.review_status ===
        "COMPLIANT"
        ? 96
        : result.review_status ===
          "HIGH_RISK"
          ? 78
          : 88;

    const score = Math.round(
      claimScore * 0.45 +
      evidenceScore * 0.3 +
      voiceScore * 0.25
    );

    const status =
      score < 70
        ? "RISK"
        : score < 82
          ? "WATCH"
          : "STABLE";

    return {
      score,
      claimScore,
      evidenceScore,
      voiceScore,
      status,
    };
  };

  const recordHealthSnapshot = (
    result
  ) => {
    const health =
      calculateReviewHealth(result);

    const snapshot = {
      id: Date.now(),
      score: health.score,
      claimScore:
        health.claimScore,
      evidenceScore:
        health.evidenceScore,
      voiceScore:
        health.voiceScore,
      status: health.status,
      source: "AI Review",
      timestamp:
        new Date().toISOString(),
    };

    setHealthHistory(
      (previous) =>
        [
          ...previous,
          snapshot,
        ].slice(-30)
    );

    const alerts = [];

    if (health.score < 70) {
      alerts.push({
        id: `health-${Date.now()}-1`,
        type: "risk",
        title:
          "Brand health risk detected",
        message:
          "The latest review indicates a significant drop in brand health.",
      });
    } else if (health.score < 82) {
      alerts.push({
        id: `health-${Date.now()}-2`,
        type: "watch",
        title:
          "Brand health requires attention",
        message:
          "Recent content signals suggest emerging brand drift.",
      });
    } else {
      alerts.push({
        id: `health-${Date.now()}-3`,
        type: "stable",
        title:
          "Brand health remains stable",
        message:
          "The latest AI review is aligned with the current brand baseline.",
      });
    }

    if (
      health.evidenceScore < 75
    ) {
      alerts.push({
        id: `evidence-${Date.now()}`,
        type: "watch",
        title:
          "Evidence coverage is weakening",
        message:
          "Several active claims require stronger supporting evidence.",
      });
    }

    setHealthAlerts(alerts);
  };

  /* ============================================================
     AI REVIEW
  ============================================================ */

  const runAIReview = async () => {
    if (!content.trim()) return;

    if (!selectedGuideline) {
      alert(
        "Please select a brand guideline first."
      );
      return;
    }

    setIsAnalyzing(true);
    setReviewResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/review-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("variety_access_token")}`,
          },
          body: JSON.stringify({
            guideline_id:
              Number(selectedGuideline),
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Review request failed"
        );
      }

      console.log(
        "VARIETY AI REVIEW:",
        data
      );

      setReviewResult(data);

      await loadNotifications();

      const high = Number(
        data.risk_summary?.high || 0
      );

      const medium = Number(
        data.risk_summary?.medium || 0
      );

      const low = Number(
        data.risk_summary?.low || 0
      );

      const reviewScore =
        data.review_status === "COMPLIANT"
          ? 98
          : Math.max(
            35,
            100 -
            high * 20 -
            medium * 10 -
            low * 2
          );

      const historyEntry = {
        id: Date.now(),

        content: content,

        reviewed_at:
          new Date().toISOString(),

        guideline_filename:
          data.guideline_filename ||
          "Unknown guideline",

        review_status:
          data.review_status ||
          "NEEDS_REVISION",

        risk_score:
          reviewScore,

        total_violations:
          Number(
            data.total_violations || 0
          ),

        high,
        medium,
        low,
      };

      setReviewHistory(
        (previous) =>
          [
            historyEntry,
            ...previous,
          ].slice(0, 30)
      );

      recordHealthSnapshot(data);

      createGovernanceItemsFromReview(
        data
      );

      if (
        (data.findings || []).length > 0
      ) {
        addGovernanceActivity(
          "AI Review completed",
          `${data.findings.length} finding(s) were evaluated for governance.`,
          "review"
        );
      } else {
        addGovernanceActivity(
          "AI Review completed",
          "No governance findings were generated from the latest review.",
          "review"
        );
      }

    } catch (error) {
      console.error(
        "VARIETY AI review error:",
        error
      );

      setReviewResult({
        review_status: "ERROR",
        message:
          error.message ||
          "Unable to connect to the VARIETY AI intelligence engine.",
      });

    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentHealth =
    useMemo(() => {
      if (
        healthHistory.length === 0
      ) {
        return {
          score: 92,
          claimScore: 89,
          evidenceScore: 92,
          voiceScore: 94,
          status: "STABLE",
        };
      }

      return healthHistory[
        healthHistory.length - 1
      ];
    }, [healthHistory]);

  const healthTrend =
    useMemo(() => {
      if (
        healthHistory.length < 2
      ) {
        return 0;
      }

      const latest = Number(
        healthHistory[
          healthHistory.length - 1
        ].score || 0
      );

      const previous = Number(
        healthHistory[
          healthHistory.length - 2
        ].score || 0
      );

      return latest - previous;
    }, [healthHistory]);

  /* ============================================================
  COMMAND CENTER — BRAND INTELLIGENCE ANALYTICS
  ============================================================ */

  const analyticsHistory = useMemo(() => {
    const sorted = [...healthHistory]
      .filter((item) => item.timestamp && Number.isFinite(Number(item.score)))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );

    if (analyticsRange === "all") {
      return sorted;
    }

    const days = analyticsRange === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return sorted.filter(
      (item) => new Date(item.timestamp).getTime() >= cutoff
    );
  }, [healthHistory, analyticsRange]);

  const analyticsRisk = useMemo(() => {
    const activeFindings = governanceItems.filter(
      (item) =>
        item.status !== "RESOLVED" &&
        item.status !== "APPROVED"
    );

    return {
      high: activeFindings.filter(
        (item) => item.severity === "high"
      ).length,
      medium: activeFindings.filter(
        (item) => item.severity === "medium"
      ).length,
      low: activeFindings.filter(
        (item) => item.severity === "low"
      ).length,
    };
  }, [governanceItems]);

  const analyticsEvidence = useMemo(() => {
    const total = evidenceItems.length;

    const verified = evidenceItems.filter(
      (item) => item.status === "Verified"
    ).length;

    return {
      total,
      verified,
      pending: total - verified,
      percentage:
        total > 0
          ? Math.round((verified / total) * 100)
          : 0,
    };
  }, [evidenceItems]);

  /* ============================================================
     STAGE 9 — GOVERNANCE METRICS
  ============================================================ */

  const governanceMetrics =
    useMemo(() => {
      const open =
        governanceItems.filter(
          (item) =>
            item.status === "OPEN"
        ).length;

      const inReview =
        governanceItems.filter(
          (item) =>
            item.status ===
            "IN REVIEW"
        ).length;

      const approved =
        governanceItems.filter(
          (item) =>
            item.status ===
            "APPROVED"
        ).length;

      const rejected =
        governanceItems.filter(
          (item) =>
            item.status ===
            "REJECTED"
        ).length;

      const resolved =
        governanceItems.filter(
          (item) =>
            item.status ===
            "RESOLVED"
        ).length;

      const critical =
        governanceItems.filter(
          (item) =>
            item.severity ===
            "high" &&
            item.status !==
            "RESOLVED" &&
            item.status !==
            "APPROVED"
        ).length;

      const active =
        governanceItems.filter(
          (item) =>
            item.status !==
            "RESOLVED" &&
            item.status !==
            "APPROVED"
        ).length;

      const decisionCount =
        approved +
        rejected +
        resolved;

      const resolutionRate =
        governanceItems.length >
          0
          ? Math.round(
            (decisionCount /
              governanceItems.length) *
            100
          )
          : 0;

      return {
        open,
        inReview,
        approved,
        rejected,
        resolved,
        critical,
        active,
        resolutionRate,
        total:
          governanceItems.length,
      };
    }, [governanceItems]);

  /* ============================================================
     DASHBOARD
  ============================================================ */

  const renderDashboard =
    () => (
      <>
        <section className="hero">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              VARIETY INTELLIGENCE ENGINE
            </div>

            <h1>
              Your brand,
              <br />
              <span>
                under intelligent protection.
              </span>
            </h1>

            <p>
              Monitor brand consistency,
              validate evidence, detect risky
              claims, and protect every piece of
              content before it reaches your
              audience.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "review"
                  )
                }
              >
                Start AI Review{" "}
                <span>→</span>
              </button>

              <button
                className="ghost-button"
                onClick={() =>
                  setActivePage(
                    "brand"
                  )
                }
              >
                Explore Brand DNA
              </button>
            </div>
          </div>

          <div className="hero-score">
            <div className="score-orbit orbit-one" />
            <div className="score-orbit orbit-two" />

            <ScoreRing
              score={
                currentHealth.score ||
                92
              }
              size={260}
            />

            <div className="score-badge">
              <span>●</span>
              {currentHealth.status ===
                "RISK"
                ? "Needs attention"
                : currentHealth.status ===
                  "WATCH"
                  ? "Watch closely"
                  : "Excellent health"}
            </div>
          </div>
        </section>

        <section className="metric-grid">
          <div className="metric-card">
            <div className="metric-icon purple">
              ◈
            </div>

            <div>
              <span className="metric-label">
                Content Reviewed
              </span>
              <strong>248</strong>
            </div>

            <span className="metric-trend">
              +18%
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-icon green">
              ✓
            </div>

            <div>
              <span className="metric-label">
                Compliance Rate
              </span>
              <strong>
                {currentHealth.score}%
              </strong>
            </div>

            <span className="metric-trend">
              {healthTrend >= 0
                ? `+${healthTrend}%`
                : `${healthTrend}%`}
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-icon orange">
              !
            </div>

            <div>
              <span className="metric-label">
                High Risk
              </span>

              <strong>
                {reviewResult
                  ?.risk_summary
                  ?.high ??
                  7}
              </strong>
            </div>

            <span className="metric-trend negative">
              LIVE
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-icon blue">
              ◎
            </div>

            <div>
              <span className="metric-label">
                Evidence Checks
              </span>

              <strong>
                {evidenceItems.length}
              </strong>
            </div>

            <span className="metric-trend">
              LIVE
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-icon purple">
              ◆
            </div>

            <div>
              <span className="metric-label">
                Governance Queue
              </span>

              <strong>
                {governanceMetrics.active}
              </strong>
            </div>

            <span className="metric-trend negative">
              {governanceMetrics.critical} HIGH
            </span>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel insight-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  AI INSIGHT
                </span>

                <h2>
                  Brand intelligence
                </h2>
              </div>

              <span className="ai-chip">
                ✦ AI ACTIVE
              </span>
            </div>

            <div className="insight-body">
              <div className="ai-symbol">
                <span>✦</span>
              </div>

              <div>
                <h3>
                  Your brand voice is highly
                  consistent.
                </h3>

                <p>
                  VARIETY detected strong
                  alignment across your latest
                  content. Your tone, claims and
                  language patterns are performing
                  above the organization baseline.
                </p>

                <div className="insight-tags">
                  <span>
                    Voice consistency{" "}
                    {currentHealth.voiceScore}%
                  </span>

                  <span>
                    Claim safety{" "}
                    {currentHealth.claimScore}%
                  </span>

                  <span>
                    Evidence{" "}
                    {currentHealth.evidenceScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel health-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  LIVE SIGNALS
                </span>

                <h2>
                  Compliance health
                </h2>
              </div>

              <span className="status-live">
                <span className="pulse-dot" />
                LIVE
              </span>
            </div>

            <div className="health-list">
              <div className="health-row">
                <div>
                  <span>
                    Brand voice
                  </span>

                  <small>
                    Consistency across content
                  </small>
                </div>

                <strong>
                  {currentHealth.voiceScore}%
                </strong>
              </div>

              <ProgressBar
                value={
                  currentHealth.voiceScore
                }
              />

              <div className="health-row">
                <div>
                  <span>
                    Evidence coverage
                  </span>

                  <small>
                    Claims supported by evidence
                  </small>
                </div>

                <strong>
                  {currentHealth.evidenceScore}%
                </strong>
              </div>

              <ProgressBar
                value={
                  currentHealth.evidenceScore
                }
              />

              <div className="health-row">
                <div>
                  <span>
                    Claim safety
                  </span>

                  <small>
                    Potentially risky statements
                  </small>
                </div>

                <strong>
                  {currentHealth.claimScore}%
                </strong>
              </div>

              <ProgressBar
                value={
                  currentHealth.claimScore
                }
              />
            </div>
          </div>
        </section>

        {/* BRAND INTELLIGENCE ANALYTICS */}

        <section className="analytics-section">
          <div className="analytics-heading">
            <div>
              <span className="panel-kicker">
                PERFORMANCE INTELLIGENCE
              </span>
              <h2>Brand intelligence analytics</h2>
              <p>
                Track saved brand-health snapshots, active findings,
                and evidence verification.
              </p>
            </div>

            <div className="analytics-filters">
              <button
                className={analyticsRange === "30d" ? "active" : ""}
                onClick={() => setAnalyticsRange("30d")}
              >
                30 days
              </button>

              <button
                className={analyticsRange === "90d" ? "active" : ""}
                onClick={() => setAnalyticsRange("90d")}
              >
                90 days
              </button>

              <button
                className={analyticsRange === "all" ? "active" : ""}
                onClick={() => setAnalyticsRange("all")}
              >
                All history
              </button>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="panel analytics-chart-panel">
              <div className="analytics-card-heading">
                <div>
                  <span className="panel-kicker">BRAND TRUST</span>
                  <h3>Health performance</h3>
                </div>

                <span className="analytics-live-tag">
                  {analyticsHistory.length} SNAPSHOTS
                </span>
              </div>

              {analyticsHistory.length > 0 ? (
                <>
                  <div className="analytics-chart">
                    <svg
                      viewBox="0 0 600 190"
                      role="img"
                      aria-label="Brand health score history"
                      preserveAspectRatio="none"
                    >
                      {[25, 65, 105, 145].map((y) => (
                        <line
                          key={y}
                          x1="30"
                          y1={y}
                          x2="570"
                          y2={y}
                          className="analytics-grid-line"
                        />
                      ))}

                      <polyline
                        points={(() => {
                          const values = analyticsHistory.map(
                            (item) => Number(item.score) || 0
                          );

                          const min = Math.min(...values);
                          const max = Math.max(...values);
                          const spread = Math.max(max - min, 5);

                          return values
                            .map((value, index) => {
                              const x =
                                values.length === 1
                                  ? 300
                                  : 30 +
                                  (index / (values.length - 1)) * 540;

                              const y =
                                145 -
                                ((value - (min - 3)) / (spread + 6)) * 120;

                              return `${x},${y}`;
                            })
                            .join(" ");
                        })()}
                        className="analytics-line"
                      />

                      {analyticsHistory.map((item, index) => {
                        const values = analyticsHistory.map(
                          (entry) => Number(entry.score) || 0
                        );

                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const spread = Math.max(max - min, 5);

                        const x =
                          values.length === 1
                            ? 300
                            : 30 +
                            (index / (values.length - 1)) * 540;

                        const y =
                          145 -
                          ((Number(item.score) - (min - 3)) /
                            (spread + 6)) *
                          120;

                        return (
                          <circle
                            key={item.id ?? index}
                            cx={x}
                            cy={y}
                            r="5"
                            className="analytics-point"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="analytics-chart-footer">
                    <span>
                      {new Date(
                        analyticsHistory[0].timestamp
                      ).toLocaleDateString()}
                    </span>

                    <strong>
                      Latest score:{" "}
                      {Number(
                        analyticsHistory[
                          analyticsHistory.length - 1
                        ].score
                      ) || 0}
                      /100
                    </strong>

                    <span>
                      {new Date(
                        analyticsHistory[
                          analyticsHistory.length - 1
                        ].timestamp
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="analytics-empty">
                  <span>◈</span>
                  <strong>No snapshots in this period</strong>
                  <p>
                    Complete a brand review or select another date range
                    to see saved health performance.
                  </p>
                </div>
              )}
            </div>

            <div className="panel analytics-risk-panel">
              <div className="analytics-card-heading">
                <div>
                  <span className="panel-kicker">RISK INTELLIGENCE</span>
                  <h3>Active findings</h3>
                </div>
                <span className="analytics-live-tag">LIVE DATA</span>
              </div>

              <div className="risk-total">
                <strong>
                  {analyticsRisk.high +
                    analyticsRisk.medium +
                    analyticsRisk.low}
                </strong>
                <span>Active findings</span>
              </div>

              {[
                {
                  label: "High risk",
                  value: analyticsRisk.high,
                  className: "high",
                },
                {
                  label: "Medium risk",
                  value: analyticsRisk.medium,
                  className: "medium",
                },
                {
                  label: "Low risk",
                  value: analyticsRisk.low,
                  className: "low",
                },
              ].map((risk) => {
                const total =
                  analyticsRisk.high +
                  analyticsRisk.medium +
                  analyticsRisk.low;

                const percentage =
                  total > 0
                    ? (risk.value / total) * 100
                    : 0;

                return (
                  <div className="risk-stat" key={risk.label}>
                    <div className="risk-stat-heading">
                      <span>{risk.label}</span>
                      <strong>{risk.value}</strong>
                    </div>

                    <div className="risk-track">
                      <div
                        className={`risk-fill ${risk.className}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <button
                className="analytics-link"
                onClick={() => setActivePage("governance")}
              >
                Review governance findings →
              </button>
            </div>

            <div className="panel analytics-evidence-panel">
              <div className="analytics-card-heading">
                <div>
                  <span className="panel-kicker">
                    EVIDENCE INTELLIGENCE
                  </span>
                  <h3>Evidence verification</h3>
                </div>
                <span className="analytics-live-tag">LIVE DATA</span>
              </div>

              <div className="evidence-score">
                <div
                  className="evidence-score-ring"
                  style={{
                    "--evidence-progress": `${analyticsEvidence.percentage}%`,
                  }}
                >
                  <div>
                    <strong>{analyticsEvidence.percentage}%</strong>
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              <div className="evidence-breakdown">
                <div>
                  <span>Verified evidence</span>
                  <strong>{analyticsEvidence.verified}</strong>
                </div>

                <div>
                  <span>Awaiting review</span>
                  <strong>{analyticsEvidence.pending}</strong>
                </div>

                <div>
                  <span>Total evidence items</span>
                  <strong>{analyticsEvidence.total}</strong>
                </div>
              </div>

              <button
                className="analytics-link"
                onClick={() => setActivePage("evidence")}
              >
                Open Evidence Intelligence →
              </button>
            </div>
          </div>
        </section>


        <section className="panel reviews-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                ACTIVITY
              </span>

              <h2>
                Recent intelligence reviews
              </h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setActivePage(
                  "review"
                )
              }
            >
              View all →
            </button>
          </div>

          <div className="review-table">
            {reviews.map((review) => (
              <div
                className="review-row"
                key={review.title}
              >
                <div className="review-main">
                  <div className="review-avatar">
                    {review.title.charAt(
                      0
                    )}
                  </div>

                  <div>
                    <strong>
                      {review.title}
                    </strong>

                    <span>
                      {review.type} ·{" "}
                      {review.time}
                    </span>
                  </div>
                </div>

                <div className="review-score">
                  <div className="mini-score">
                    <ProgressBar
                      value={
                        review.score
                      }
                    />
                  </div>

                  <strong>
                    {review.score}
                  </strong>
                </div>

                <span
                  className={`status-pill ${review.status ===
                    "Compliant"
                    ? "success"
                    : "warning"
                    }`}
                >
                  {review.status}
                </span>

                <span className="row-arrow">
                  →
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* STAGE 9 DASHBOARD GOVERNANCE SNAPSHOT */}

        <section className="panel governance-dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                GOVERNANCE
              </span>

              <h2>
                Decision center
              </h2>

              <p>
                Active AI findings requiring
                governance decisions.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setActivePage(
                  "governance"
                )
              }
            >
              Open Governance Center{" "}
              <span>→</span>
            </button>
          </div>

          <div className="governance-dashboard-stats">
            <div>
              <span>
                Open
              </span>

              <strong>
                {governanceMetrics.open}
              </strong>
            </div>

            <div>
              <span>
                In Review
              </span>

              <strong>
                {governanceMetrics.inReview}
              </strong>
            </div>

            <div>
              <span>
                High Risk
              </span>

              <strong>
                {governanceMetrics.critical}
              </strong>
            </div>

            <div>
              <span>
                Resolution
              </span>

              <strong>
                {governanceMetrics.resolutionRate}%
              </strong>
            </div>
          </div>
        </section>
      </>
    );



  function renderReviewHistory() {
    return (
      <section className="page-section">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              CONTENT INTELLIGENCE
            </span>

            <h1>Review History</h1>

            <p>
              Every content review performed by VARIETY AI.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Reviews</h2>
              <p>
                {reviewHistory.length} reviews stored
              </p>
            </div>
          </div>

          <div className="review-history-list">
            {reviewHistory.length === 0 ? (
              <div className="empty-state">
                No reviews have been stored yet.
              </div>
            ) : (
              reviewHistory.map((review) => (
                <div
                  className="review-history-card"
                  key={review.id}
                >
                  <div>
                    <span className="review-id">
                      RV-{review.id}
                    </span>

                    <h3>
                      {review.content
                        ? review.content.slice(0, 80)
                        : `${review.guideline_filename || "Brand review"} — ${review.review_status || "Review"}`}
                      {review.content &&
                        review.content.length > 80
                        ? "..."
                        : ""}
                    </h3>

                    <p>
                      {new Date(
                        review.reviewed_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="review-history-risk">
                    <span
                      className={`status-badge ${review.review_status === "COMPLIANT"
                        ? "status-compliant"
                        : review.review_status === "HIGH_RISK"
                          ? "status-high"
                          : "status-warning"
                        }`}
                    >
                      {review.review_status || "NEEDS_REVISION"}
                    </span>

                    <strong>
                      {review.total_violations || 0}
                    </strong>

                    <span>findings</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     BRAND INTELLIGENCE
  ============================================================ */

  const renderBrand = () => (
    <div className="page-section brand-intelligence">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            BRAND INTELLIGENCE
          </span>

          <h1>
            Your brand, decoded into
            intelligence.
          </h1>

          <p>
            VARIETY transforms your approved
            brand guidelines into structured
            intelligence that can be used across
            every content review.
          </p>
        </div>

        <div className="studio-status">
          <span className="pulse-dot" />
          Brand intelligence active
        </div>
      </div>

      <div className="brand-overview-grid">
        <div className="panel brand-score-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                BRAND TRUST SCORE
              </span>

              <h2>
                Overall brand health
              </h2>
            </div>

            <span className="status-badge">
              Strong
            </span>
          </div>

          <div className="brand-score-content">
            <ScoreRing
              score={
                currentHealth.score
              }
              size={190}
            />

            <div className="brand-score-copy">
              <strong>
                {currentHealth.score}
              </strong>

              <span>/100</span>

              <p>
                Your brand identity is strongly
                defined across voice, language,
                evidence, claims and
                accessibility.
              </p>

              <div className="score-trend">
                <span>
                  {healthTrend >= 0
                    ? `↑ ${healthTrend}%`
                    : `↓ ${Math.abs(
                      healthTrend
                    )}%`}
                </span>

                <small>
                  vs. previous assessment
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="panel brand-summary-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                DIGITAL BRAND DNA
              </span>

              <h2>
                Intelligence profile
              </h2>
            </div>

            <span className="summary-icon">
              ✦
            </span>
          </div>

          <div className="dna-summary-list">
            {[
              "Voice",
              "Language",
              "Facts",
              "Claims",
              "Visuals",
              "Accessibility",
            ].map((name) => {
              const score =
                {
                  Voice:
                    currentHealth.voiceScore,
                  Language: 91,
                  Facts:
                    currentHealth.evidenceScore,
                  Claims:
                    currentHealth.claimScore,
                  Visuals: 93,
                  Accessibility: 95,
                }[name];

              return (
                <div
                  className="dna-summary-row"
                  key={name}
                >
                  <span>
                    {name}
                  </span>

                  <div className="dna-summary-bar">
                    <div
                      style={{
                        width: `${score}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {score}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="upload-guidelines-panel">
        <div className="upload-guidelines-copy">
          <span className="panel-kicker">
            BRAND GOVERNANCE
          </span>

          <h2>
            Upload brand guidelines
          </h2>

          <p>
            Upload your approved brand
            guidelines and let VARIETY use them
            as the foundation for AI-powered
            content review.
          </p>

          <div className="upload-supported">
            <span>PDF</span>
            <span>DOCX</span>
            <span>MAX 10 MB</span>
          </div>
        </div>

        <label className="upload-button">
          <input
            type="file"
            accept=".pdf,.docx"
            hidden
            onChange={(e) => {
              uploadGuideline(
                e.target.files[0]
              );
              e.target.value = "";
            }}
          />

          {isUploading ? (
            <>
              <span className="upload-spinner" />
              Uploading...
            </>
          ) : (
            <>
              <span>↑</span>
              Upload Guidelines
            </>
          )}
        </label>
      </div>

      {uploadMessage && (
        <div className="upload-success">
          ✓ {uploadMessage}
        </div>
      )}

      {uploadError && (
        <div className="upload-error">
          ! {uploadError}
        </div>
      )}

      <div className="section-header">
        <div>
          <span className="eyebrow">
            INTELLIGENCE LAYERS
          </span>

          <h2>
            Digital Brand DNA
          </h2>

          <p>
            Six intelligence layers define how
            VARIETY understands and protects your
            brand.
          </p>
        </div>

        <div className="section-meta">
          <span className="live-indicator">
            <span className="pulse-dot" />
            Live intelligence
          </span>
        </div>
      </div>

      <div className="brand-dna-grid">
        {brandDNA.map((item) => (
          <div
            className="panel dna-card"
            key={item.title}
          >
            <div className="dna-card-top">
              <div className="dna-icon">
                {item.icon}
              </div>

              <div className="dna-score">
                {item.score}
              </div>
            </div>

            <div className="dna-card-content">
              <span className="panel-kicker">
                {item.title}
              </span>

              <h3>
                {item.value}
              </h3>

              <p>
                {item.description}
              </p>
            </div>

            <div className="dna-progress">
              <ProgressBar
                value={item.score}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="section-header guideline-library-header">
        <div>
          <span className="eyebrow">
            KNOWLEDGE BASE
          </span>

          <h2>
            Brand guideline library
          </h2>

          <p>
            Approved documents available to the
            VARIETY intelligence engine.
          </p>
        </div>

        <div className="guideline-count">
          <strong>
            {guidelines.length}
          </strong>

          <span>
            {guidelines.length === 1
              ? "Guideline"
              : "Guidelines"}
          </span>
        </div>
      </div>

      <div className="guideline-library">
        {guidelines.length > 0 ? (
          guidelines.map(
            (guideline) => (
              <div
                className="panel guideline-card"
                key={guideline.id}
              >
                <div className="guideline-file-icon">
                  {guideline.file_type ===
                    "pdf"
                    ? "PDF"
                    : "DOCX"}
                </div>

                <div className="guideline-info">
                  <strong>
                    {guideline.filename}
                  </strong>

                  <span>
                    Uploaded{" "}
                    {new Date(
                      guideline.uploaded_at
                    ).toLocaleString()}
                  </span>

                  <small>
                    {guideline.extracted_text
                      ? `${guideline.extracted_text.length.toLocaleString()} characters extracted`
                      : "Text extraction available"}
                  </small>
                </div>

                <div className="guideline-status">
                  <span className="status-badge">
                    Ready
                  </span>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setSelectedGuideline(
                      String(
                        guideline.id
                      )
                    );

                    setActivePage(
                      "review"
                    );
                  }}
                >
                  Use for Review{" "}
                  <span>→</span>
                </button>
              </div>
            )
          )
        ) : (
          <div className="panel empty-guidelines">
            <div className="empty-orb">
              <span>↑</span>
            </div>

            <div>
              <h3>
                No brand guidelines
                uploaded
              </h3>

              <p>
                Upload a PDF or DOCX guideline
                above to create your first brand
                intelligence layer.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="panel brand-insight-panel">
        <div className="brand-insight-icon">
          ✦
        </div>

        <div className="brand-insight-content">
          <span className="panel-kicker">
            VARIETY INTELLIGENCE
          </span>

          <h2>
            Your guidelines become active
            intelligence.
          </h2>

          <p>
            VARIETY doesn't simply store your
            brand documents. The extracted
            knowledge becomes the foundation for
            content reviews, claim checks,
            terminology validation and future
            brand-governance workflows.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            setActivePage("review")
          }
        >
          Open AI Review Studio{" "}
          <span>→</span>
        </button>
      </div>
    </div>
  );

  /* ============================================================
     AI REVIEW STUDIO
  ============================================================ */

  const renderReview = () => {
    const result = reviewResult;

    const status =
      result?.review_status || "";

    const findings =
      result?.findings || [];

    const riskSummary =
      result?.risk_summary || {
        high: 0,
        medium: 0,
        low: 0,
      };

    const totalViolations =
      result?.total_violations ??
      findings.length;

    const getStatusLabel = () =>
      status === "HIGH_RISK"
        ? "High Risk"
        : status ===
          "NEEDS_REVISION"
          ? "Needs Revision"
          : status ===
            "COMPLIANT"
            ? "Compliant"
            : "Awaiting Review";

    const getStatusClass = () =>
      status === "HIGH_RISK"
        ? "risk-high"
        : status ===
          "NEEDS_REVISION"
          ? "risk-medium"
          : status ===
            "COMPLIANT"
            ? "risk-low"
            : "risk-neutral";

    const highRiskPenalty =
      Math.min(
        60,
        Number(
          riskSummary.high || 0
        ) * 20
      );

    const mediumRiskPenalty =
      Math.min(
        35,
        Number(
          riskSummary.medium || 0
        ) * 12
      );

    const riskScore = !result
      ? 0
      : status === "HIGH_RISK"
        ? Math.max(
          35,
          100 -
          highRiskPenalty
        )
        : status ===
          "NEEDS_REVISION"
          ? Math.max(
            60,
            100 -
            mediumRiskPenalty
          )
          : status ===
            "COMPLIANT"
            ? 98
            : 0;

    return (
      <div className="page-section review-studio">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              AI REVIEW STUDIO
            </span>

            <h1>
              Review content against your
              brand intelligence.
            </h1>

            <p>
              Analyze content using your approved
              brand guidelines, identify risks and
              receive actionable recommendations.
            </p>
          </div>

          <div className="studio-status">
            <span className="pulse-dot" />
            Intelligence engine active
          </div>
        </div>

        <div className="review-workspace">
          <div className="panel review-input-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  CONTENT ANALYSIS
                </span>

                <h2>
                  Submit content for review
                </h2>
              </div>

              <span className="review-engine-badge">
                VARIETY ENGINE v2.0
              </span>
            </div>

            <div className="review-field">
              <label>
                Brand guideline
              </label>

              <select
                value={
                  selectedGuideline
                }
                onChange={(e) =>
                  setSelectedGuideline(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select a brand guideline
                </option>

                {guidelines.map(
                  (guideline) => (
                    <option
                      key={guideline.id}
                      value={
                        guideline.id
                      }
                    >
                      {
                        guideline.filename
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="review-field">
              <div className="field-header">
                <label>
                  Content to analyze
                </label>

                <span>
                  {content.length.toLocaleString()}{" "}
                  characters
                </span>
              </div>

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(
                    e.target.value
                  )
                }
                placeholder="Paste campaign copy, website content, product messaging or any other brand communication here..."
              />
            </div>

            <div className="review-actions">
              <button
                className="primary-button review-button"
                onClick={runAIReview}
                disabled={
                  isAnalyzing ||
                  !content.trim() ||
                  !selectedGuideline
                }
              >
                {isAnalyzing ? (
                  <>
                    <span className="button-spinner" />
                    Analyzing content...
                  </>
                ) : (
                  <>
                    Analyze with VARIETY{" "}
                    <span>→</span>
                  </>
                )}
              </button>

              {content && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setContent("");
                    setReviewResult(
                      null
                    );
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="panel review-info-panel">
            <span className="panel-kicker">
              HOW VARIETY REVIEWS
            </span>

            <h2>
              Brand intelligence in action.
            </h2>

            <p>
              VARIETY compares your content
              against the selected approved
              guideline and evaluates claims,
              terminology, messaging and brand
              risk.
            </p>

            <div className="review-process">
              <div>
                <span>01</span>
                <strong>
                  Guideline
                </strong>
                <small>
                  Load approved brand
                  intelligence
                </small>
              </div>

              <div>
                <span>02</span>
                <strong>
                  Analyze
                </strong>
                <small>
                  Detect potential conflicts
                </small>
              </div>

              <div>
                <span>03</span>
                <strong>
                  Recommend
                </strong>
                <small>
                  Generate corrective
                  guidance
                </small>
              </div>
            </div>
          </div>
        </div>

        {result &&
          result.review_status !==
          "ERROR" && (
            <div className="review-results">
              <div className="review-result-header">
                <div>
                  <span className="eyebrow">
                    REVIEW COMPLETE
                  </span>

                  <h2>
                    Brand compliance
                    assessment
                  </h2>

                  <p>
                    {result.guideline_filename
                      ? `Analyzed against ${result.guideline_filename}`
                      : "Analysis completed by the VARIETY intelligence engine."}
                  </p>
                </div>

                <div
                  className={`review-status-pill ${getStatusClass()}`}
                >
                  <span />
                  {getStatusLabel()}
                </div>
              </div>

              <div className="risk-overview-grid">
                <div className="panel risk-score-panel">
                  <div
                    className="risk-score-circle"
                    style={{
                      "--score":
                        riskScore,
                    }}
                  >
                    <div>
                      <strong>
                        {riskScore}
                      </strong>

                      <span>
                        /100
                      </span>
                    </div>
                  </div>

                  <div className="risk-score-copy">
                    <span className="panel-kicker">
                      BRAND SAFETY SCORE
                    </span>

                    <h3>
                      {getStatusLabel()}
                    </h3>

                    <p>
                      {status ===
                        "HIGH_RISK"
                        ? "High-priority brand risks were detected and should be addressed before publishing."
                        : status ===
                          "NEEDS_REVISION"
                          ? "Some brand issues were detected. Review the recommendations before publishing."
                          : "No active brand rule violations were detected in the submitted content."}
                    </p>
                  </div>
                </div>

                <div className="risk-stat-card">
                  <span className="risk-stat-label">
                    TOTAL FINDINGS
                  </span>

                  <strong>
                    {totalViolations}
                  </strong>

                  <span>
                    {totalViolations ===
                      1
                      ? "issue detected"
                      : "issues detected"}
                  </span>
                </div>

                <div className="risk-stat-card high">
                  <span className="risk-stat-label">
                    HIGH RISK
                  </span>

                  <strong>
                    {riskSummary.high ||
                      0}
                  </strong>

                  <span>
                    critical findings
                  </span>
                </div>

                <div className="risk-stat-card medium">
                  <span className="risk-stat-label">
                    MEDIUM RISK
                  </span>

                  <strong>
                    {riskSummary.medium ||
                      0}
                  </strong>

                  <span>
                    findings to review
                  </span>
                </div>
              </div>

              <div className="section-header review-findings-header">
                <div>
                  <span className="eyebrow">
                    INTELLIGENCE FINDINGS
                  </span>

                  <h2>
                    Detected brand risks
                  </h2>

                  <p>
                    Every finding includes
                    detected language, reasoning
                    and a recommended correction.
                  </p>
                </div>

                <div className="findings-count">
                  {findings.length}{" "}
                  {findings.length ===
                    1
                    ? "finding"
                    : "findings"}
                </div>
              </div>

              {findings.length >
                0 ? (
                <div className="findings-list">
                  {findings.map(
                    (
                      finding,
                      index
                    ) => {
                      const severity =
                        String(
                          finding.severity ||
                          "medium"
                        ).toLowerCase();

                      const detectedText =
                        finding.detected_text ||
                        finding.matched_text ||
                        finding.detected_language ||
                        finding.text ||
                        finding.pattern ||
                        "No detected text provided.";

                      const explanation =
                        finding.explanation ||
                        finding.reason ||
                        finding.why_flagged ||
                        "This content conflicts with the selected brand guideline.";

                      const recommendation =
                        finding.suggestion ||
                        finding.recommended_action ||
                        finding.recommendation ||
                        "Revise the language to align with the selected brand guideline.";

                      return (
                        <div
                          className="finding-card"
                          key={`${index}-${finding.title || finding.rule_name || "finding"}`}
                        >
                          <div className="finding-card-header">
                            <div>
                              <span className="finding-category">
                                {finding.category ||
                                  "Brand Compliance"}
                              </span>

                              <h3>
                                {finding.title ||
                                  finding.name ||
                                  finding.rule_name ||
                                  `Finding ${index + 1}`}
                              </h3>
                            </div>

                            <span
                              className={`finding-severity ${severity}`}
                            >
                              {severity.toUpperCase()}
                            </span>
                          </div>

                          <div className="finding-detected">
                            <span className="finding-label">
                              Detected language
                            </span>

                            <p>
                              {detectedText}
                            </p>
                          </div>

                          <div className="finding-detail-grid">
                            <div className="finding-explanation">
                              <div className="finding-detail-title">
                                <span className="finding-icon">
                                  !
                                </span>

                                <strong>
                                  Why this was
                                  flagged
                                </strong>
                              </div>

                              <p>
                                {explanation}
                              </p>
                            </div>

                            <div className="finding-recommendation">
                              <div className="finding-detail-title">
                                <span className="finding-icon">
                                  ✓
                                </span>

                                <strong>
                                  Recommended
                                  action
                                </strong>
                              </div>

                              <p>
                                {recommendation}
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop:
                                "18px",
                              display:
                                "flex",
                              justifyContent:
                                "flex-end",
                              gap: "10px",
                            }}
                          >
                            <button
                              className="secondary-button"
                              onClick={() =>
                                createGovernanceFromFinding(
                                  finding,
                                  result
                                )
                              }
                            >
                              Send to Governance{" "}
                              <span>
                                ◆
                              </span>
                            </button>

                            <button
                              className="secondary-button"
                              onClick={() =>
                                createEvidenceFromFinding(
                                  finding
                                )
                              }
                            >
                              Create Evidence Check{" "}
                              <span>
                                →
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="panel clean-review-panel">
                  <div className="clean-review-icon">
                    ✓
                  </div>

                  <div>
                    <span className="panel-kicker">
                      BRAND COMPLIANT
                    </span>

                    <h3>
                      No rule violations
                      detected.
                    </h3>

                    <p>
                      The submitted content
                      passed the active VARIETY
                      brand governance checks.
                    </p>
                  </div>
                </div>
              )}

              <div className="panel review-footer-panel">
                <div>
                  <span className="panel-kicker">
                    VARIETY INTELLIGENCE
                  </span>

                  <h3>
                    Review complete.
                  </h3>

                  <p>
                    This assessment was generated
                    using the selected brand
                    guideline and VARIETY's active
                    rule intelligence engine.
                  </p>
                </div>

                <div className="review-footer-meta">
                  <span>
                    Engine
                  </span>

                  <strong>
                    {result.engine_version ||
                      "2.0"}
                  </strong>

                  <span>
                    Findings
                  </span>

                  <strong>
                    {totalViolations}
                  </strong>

                  <span>
                    Governance
                  </span>

                  <strong>
                    {findings.length}
                  </strong>
                </div>
              </div>
            </div>
          )}

        {result?.review_status ===
          "ERROR" && (
            <div className="panel review-error-panel">
              <div className="review-error-icon">
                !
              </div>

              <div>
                <span className="panel-kicker">
                  REVIEW ERROR
                </span>

                <h2>
                  Unable to complete the
                  analysis.
                </h2>

                <p>
                  {result.message ||
                    "The VARIETY intelligence engine could not complete this review."}
                </p>
              </div>
            </div>
          )}
      </div>
    );
  };

  /* ============================================================
     EVIDENCE INTELLIGENCE
  ============================================================ */

  const renderEvidence = () => {
    const verifiedCount =
      evidenceItems.filter(
        (item) =>
          item.status ===
          "Verified"
      ).length;

    const reviewCount =
      evidenceItems.filter(
        (item) =>
          item.status ===
          "Review"
      ).length;

    const averageScore =
      evidenceItems.length > 0
        ? Math.round(
          evidenceItems.reduce(
            (total, item) =>
              total +
              Number(
                item.score || 0
              ),
            0
          ) /
          evidenceItems.length
        )
        : 0;

    const unsupportedCount =
      evidenceItems.filter(
        (item) =>
          Number(
            item.score
          ) < 50
      ).length;

    return (
      <div className="page-section">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              EVIDENCE INTELLIGENCE
            </span>

            <h1>
              Every important claim deserves
              proof.
            </h1>

            <p>
              Track evidence coverage and
              identify claims that need stronger
              support before publication.
            </p>
          </div>

          <div className="heading-score evidence">
            <span>
              Evidence confidence
            </span>

            <strong>
              {averageScore}%
            </strong>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-icon green">
              ✓
            </div>

            <div>
              <span className="metric-label">
                Verified claims
              </span>

              <strong>
                {verifiedCount}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon orange">
              !
            </div>

            <div>
              <span className="metric-label">
                Needs review
              </span>

              <strong>
                {reviewCount}
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon blue">
              ◎
            </div>

            <div>
              <span className="metric-label">
                Evidence coverage
              </span>

              <strong>
                {averageScore}%
              </strong>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon purple">
              ◈
            </div>

            <div>
              <span className="metric-label">
                Total evidence checks
              </span>

              <strong>
                {evidenceItems.length}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                ADD EVIDENCE
              </span>

              <h2>
                Create an evidence check
              </h2>
            </div>

            <span className="ai-chip">
              ✦ INTELLIGENCE
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr auto",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div className="review-field">
              <label>
                Claim
              </label>

              <input
                value={
                  newEvidenceClaim
                }
                onChange={(e) =>
                  setNewEvidenceClaim(
                    e.target.value
                  )
                }
                placeholder="Enter an important brand claim..."
              />
            </div>

            <div className="review-field">
              <label>
                Evidence source
              </label>

              <input
                value={
                  newEvidenceSource
                }
                onChange={(e) =>
                  setNewEvidenceSource(
                    e.target.value
                  )
                }
                placeholder="e.g. Research report, product documentation..."
              />
            </div>

            <button
              className="primary-button"
              onClick={
                addEvidenceItem
              }
              disabled={
                !newEvidenceClaim.trim()
              }
            >
              Add Evidence{" "}
              <span>+</span>
            </button>
          </div>
        </div>

        <div className="evidence-grid">
          <div className="panel evidence-main">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  EVIDENCE NETWORK
                </span>

                <h2>
                  Verification overview
                </h2>
              </div>

              <span className="ai-chip">
                ✦ AI ACTIVE
              </span>
            </div>

            {evidenceItems.length >
              0 ? (
              evidenceItems.map(
                (item) => (
                  <div
                    className="evidence-row"
                    key={item.id}
                  >
                    <div className="evidence-check">
                      {item.status ===
                        "Verified"
                        ? "✓"
                        : "!"}
                    </div>

                    <div className="evidence-info">
                      <strong>
                        {item.claim}
                      </strong>

                      <span>
                        {item.source}
                      </span>
                    </div>

                    <div className="evidence-progress">
                      <ProgressBar
                        value={
                          item.score
                        }
                      />
                    </div>

                    <strong>
                      {item.score}%
                    </strong>

                    <span
                      className={`status-pill ${item.status ===
                        "Verified"
                        ? "success"
                        : "warning"
                        }`}
                    >
                      {item.status}
                    </span>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "6px",
                      }}
                    >
                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateEvidenceStatus(
                            item.id,
                            item.status ===
                              "Verified"
                              ? "Review"
                              : "Verified"
                          )
                        }
                      >
                        {item.status ===
                          "Verified"
                          ? "Review"
                          : "Verify"}
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          removeEvidenceItem(
                            item.id
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="panel empty-guidelines">
                <div className="empty-orb">
                  ◎
                </div>

                <div>
                  <h3>
                    No evidence checks
                  </h3>

                  <p>
                    Add your first important
                    brand claim above.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="panel evidence-score-panel">
            <span className="panel-kicker">
              TRUST INDEX
            </span>

            <div className="big-index">
              {averageScore}
            </div>

            <span className="index-label">
              Evidence confidence
            </span>

            <div className="confidence-list">
              <div>
                <span>
                  Verified claims
                </span>

                <strong>
                  {verifiedCount}
                </strong>
              </div>

              <div>
                <span>
                  Needs review
                </span>

                <strong>
                  {reviewCount}
                </strong>
              </div>

              <div>
                <span>
                  Unsupported
                </span>

                <strong>
                  {unsupportedCount}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="panel brand-insight-panel">
          <div className="brand-insight-icon">
            ◎
          </div>

          <div className="brand-insight-content">
            <span className="panel-kicker">
              EVIDENCE INTELLIGENCE
            </span>

            <h2>
              Strong evidence creates safer
              brand claims.
            </h2>

            <p>
              VARIETY tracks whether important
              brand statements are supported by
              credible evidence before
              publication. Evidence checks created
              here persist in this browser for
              your prototype.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              setActivePage(
                "review"
              )
            }
          >
            Open AI Review Studio{" "}
            <span>→</span>
          </button>
        </div>
      </div>
    );
  };

  /* ============================================================
     BRAND HEALTH / DRIFT
  ============================================================ */

  const renderDrift = () => {
    const latest = currentHealth;

    const previous =
      healthHistory.length > 1
        ? healthHistory[
        healthHistory.length - 2
        ]
        : null;

    const evidenceScore =
      Number(
        latest.evidenceScore ??
        92
      );

    const claimScore =
      Number(
        latest.claimScore ??
        89
      );

    const voiceScore =
      Number(
        latest.voiceScore ??
        94
      );

    const overallScore =
      Number(
        latest.score ?? 92
      );

    const overallStatus =
      overallScore < 70
        ? "RISK"
        : overallScore < 82
          ? "WATCH"
          : "STABLE";

    const trend = previous
      ? overallScore -
      Number(
        previous.score || 0
      )
      : 0;

    const driftMetrics = [
      {
        status:
          voiceScore < 75
            ? "RISK"
            : voiceScore < 85
              ? "WATCH"
              : "STABLE",

        className:
          voiceScore < 75
            ? "risk"
            : voiceScore < 85
              ? "watch"
              : "stable",

        title: "Brand voice",

        score: voiceScore,

        description:
          voiceScore < 85
            ? "Voice consistency is showing signs of drift."
            : "Strong consistency across recent content.",
      },

      {
        status: "STABLE",
        className: "stable",
        title: "Visual identity",
        score: 93,
        description:
          "Visual language remains aligned with the brand baseline.",
      },

      {
        status:
          claimScore < 70
            ? "RISK"
            : claimScore < 82
              ? "WATCH"
              : "STABLE",

        className:
          claimScore < 70
            ? "risk"
            : claimScore < 82
              ? "watch"
              : "stable",

        title: "Claim language",

        score: claimScore,

        description:
          claimScore < 82
            ? "Recent content contains signals that require closer claim monitoring."
            : "Claim language remains within the current brand baseline.",
      },

      {
        status:
          evidenceScore < 70
            ? "RISK"
            : evidenceScore < 82
              ? "WATCH"
              : "STABLE",

        className:
          evidenceScore < 70
            ? "risk"
            : evidenceScore < 82
              ? "watch"
              : "stable",

        title: "Evidence discipline",

        score: evidenceScore,

        description:
          evidenceScore < 82
            ? "Several claims may require stronger supporting evidence."
            : "Evidence confidence remains strong across active checks.",
      },
    ];

    const timeline =
      healthHistory.slice(-9);

    return (
      <div className="page-section">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              BRAND HEALTH MONITORING
            </span>

            <h1>
              Catch brand drift before your
              audience does.
            </h1>

            <p>
              VARIETY compares your content
              against the brand intelligence
              baseline.
            </p>
          </div>

          <div className="studio-status">
            <span className="pulse-dot" />
            Monitoring active
          </div>
        </div>

        <div className="brand-overview-grid">
          <div className="panel brand-score-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  BRAND HEALTH INDEX
                </span>

                <h2>
                  Current intelligence score
                </h2>
              </div>

              <span
                className={`status-badge ${overallStatus ===
                  "RISK"
                  ? "risk"
                  : overallStatus ===
                    "WATCH"
                    ? "warning"
                    : ""
                  }`}
              >
                {overallStatus}
              </span>
            </div>

            <div className="brand-score-content">
              <ScoreRing
                score={
                  overallScore
                }
                size={190}
              />

              <div className="brand-score-copy">
                <strong>
                  {overallScore}
                </strong>

                <span>/100</span>

                <p>
                  Current brand health is
                  calculated from claim safety,
                  evidence confidence and brand
                  voice consistency.
                </p>

                <div className="score-trend">
                  <span>
                    {trend >= 0
                      ? `↑ ${trend}%`
                      : `↓ ${Math.abs(
                        trend
                      )}%`}
                  </span>

                  <small>
                    versus previous health
                    snapshot
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="panel brand-summary-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  HEALTH SIGNALS
                </span>

                <h2>
                  Live monitoring profile
                </h2>
              </div>

              <span className="summary-icon">
                ◌
              </span>
            </div>

            <div className="dna-summary-list">
              {[
                [
                  "Voice",
                  voiceScore,
                ],
                [
                  "Claims",
                  claimScore,
                ],
                [
                  "Evidence",
                  evidenceScore,
                ],
                [
                  "Overall",
                  overallScore,
                ],
              ].map(
                ([name, score]) => (
                  <div
                    className="dna-summary-row"
                    key={name}
                  >
                    <span>
                      {name}
                    </span>

                    <div className="dna-summary-bar">
                      <div
                        style={{
                          width: `${score}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {score}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="drift-grid">
          {driftMetrics.map(
            (metric) => (
              <div
                className={`drift-card ${metric.className}`}
                key={metric.title}
              >
                <div className="drift-icon">
                  {metric.status ===
                    "STABLE"
                    ? "✓"
                    : "!"}
                </div>

                <span className="drift-status">
                  {metric.status}
                </span>

                <h3>
                  {metric.title}
                </h3>

                <strong>
                  {metric.score}%
                </strong>

                <p>
                  {metric.description}
                </p>

                <ProgressBar
                  value={
                    metric.score
                  }
                />
              </div>
            )
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                INTELLIGENCE ALERTS
              </span>

              <h2>
                Brand health signals
              </h2>
            </div>

            <span className="ai-chip">
              ✦ LIVE MONITORING
            </span>
          </div>

          <div className="health-list">
            {healthAlerts.length >
              0 ? (
              healthAlerts.map(
                (alert) => (
                  <div
                    className="health-row"
                    key={alert.id}
                  >
                    <div>
                      <span>
                        {alert.title}
                      </span>

                      <small>
                        {alert.message}
                      </small>
                    </div>

                    <span
                      className={`status-pill ${alert.type ===
                        "stable"
                        ? "success"
                        : "warning"
                        }`}
                    >
                      {alert.type ===
                        "stable"
                        ? "Stable"
                        : "Attention"}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="health-row">
                <div>
                  <span>
                    Brand health monitoring
                    active
                  </span>

                  <small>
                    Run an AI review to generate
                    the first live health signal.
                  </small>
                </div>

                <span className="status-pill success">
                  LIVE
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="panel drift-timeline">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                DRIFT TIMELINE
              </span>

              <h2>
                Brand health over time
              </h2>

              <p>
                Historical snapshots are created
                automatically after successful AI
                reviews.
              </p>
            </div>

            <span className="status-badge">
              {healthHistory.length}{" "}
              snapshots
            </span>
          </div>

          <div className="fake-chart">
            <div className="chart-line">
              {timeline.map(
                (point) => (
                  <span
                    key={point.id}
                    title={`${point.score}% — ${new Date(
                      point.timestamp
                    ).toLocaleDateString()}`}
                    style={{
                      height: `${Math.max(
                        20,
                        Math.min(
                          100,
                          Number(
                            point.score
                          ) || 0
                        )
                      )}%`,
                    }}
                  />
                )
              )}
            </div>

            <div className="chart-labels">
              {timeline.map(
                (point) => (
                  <span
                    key={`label-${point.id}`}
                  >
                    {new Date(
                      point.timestamp
                    ).toLocaleDateString(
                      undefined,
                      {
                        month:
                          "short",
                      }
                    )}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                HEALTH BREAKDOWN
              </span>

              <h2>
                What is driving brand health?
              </h2>
            </div>
          </div>

          <div className="health-list">
            <div className="health-row">
              <div>
                <span>
                  Brand voice consistency
                </span>

                <small>
                  Tone, language and
                  communication patterns
                </small>
              </div>

              <strong>
                {voiceScore}%
              </strong>
            </div>

            <ProgressBar
              value={voiceScore}
            />

            <div className="health-row">
              <div>
                <span>
                  Claim safety
                </span>

                <small>
                  Risk level across analyzed
                  claims
                </small>
              </div>

              <strong>
                {claimScore}%
              </strong>
            </div>

            <ProgressBar
              value={claimScore}
            />

            <div className="health-row">
              <div>
                <span>
                  Evidence confidence
                </span>

                <small>
                  Strength of active evidence
                  checks
                </small>
              </div>

              <strong>
                {evidenceScore}%
              </strong>
            </div>

            <ProgressBar
              value={evidenceScore}
            />
          </div>
        </div>

        <div className="panel brand-insight-panel">
          <div className="brand-insight-icon">
            ◌
          </div>

          <div className="brand-insight-content">
            <span className="panel-kicker">
              BRAND HEALTH
            </span>

            <h2>
              Your intelligence baseline is
              being monitored.
            </h2>

            <p>
              Brand Health now responds to your
              evidence confidence, claim safety
              and latest AI review signals. Every
              successful review creates a new
              health snapshot so the prototype can
              demonstrate longitudinal brand
              monitoring.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              setActivePage(
                "review"
              )
            }
          >
            Run New Review{" "}
            <span>→</span>
          </button>
        </div>
      </div>
    );
  };

  /* ============================================================
     STAGE 9 — GOVERNANCE CENTER
  ============================================================ */

  const renderGovernance =
    () => {
      const activeItems =
        governanceItems.filter(
          (item) =>
            item.status !==
            "RESOLVED" &&
            item.status !==
            "APPROVED"
        );

      const severityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      const sortedItems = [
        ...activeItems,
      ].sort(
        (a, b) =>
          (severityOrder[
            a.severity
          ] || 9) -
          (severityOrder[
            b.severity
          ] || 9)
      );

      return (
        <div className="page-section governance-center">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                GOVERNANCE CENTER
              </span>

              <h1>
                Turn AI findings into
                accountable decisions.
              </h1>

              <p>
                Review, approve, reject and resolve
                brand intelligence findings before
                they become publishing risks.
              </p>
            </div>

            <div className="studio-status">
              <span className="pulse-dot" />
              Governance engine active
            </div>
          </div>

          {/* GOVERNANCE KPIs */}

          <div className="metric-grid governance-metric-grid">
            <div className="metric-card">
              <div className="metric-icon orange">
                !
              </div>

              <div>
                <span className="metric-label">
                  Open Issues
                </span>

                <strong>
                  {governanceMetrics.open}
                </strong>
              </div>

              <span className="metric-trend negative">
                ACTIVE
              </span>
            </div>

            <div className="metric-card">
              <div className="metric-icon purple">
                ◆
              </div>

              <div>
                <span className="metric-label">
                  Critical Issues
                </span>

                <strong>
                  {governanceMetrics.critical}
                </strong>
              </div>

              <span className="metric-trend negative">
                HIGH
              </span>
            </div>

            <div className="metric-card">
              <div className="metric-icon blue">
                ◌
              </div>

              <div>
                <span className="metric-label">
                  In Review
                </span>

                <strong>
                  {governanceMetrics.inReview}
                </strong>
              </div>

              <span className="metric-trend">
                WORKFLOW
              </span>
            </div>

            <div className="metric-card">
              <div className="metric-icon green">
                ✓
              </div>

              <div>
                <span className="metric-label">
                  Resolved
                </span>

                <strong>
                  {governanceMetrics.resolved}
                </strong>
              </div>

              <span className="metric-trend">
                {governanceMetrics.resolutionRate}%
              </span>
            </div>
          </div>

          {/* GOVERNANCE COMMAND BAR */}

          <div className="panel governance-command-panel">
            <div>
              <span className="panel-kicker">
                DECISION CONTROL
              </span>

              <h2>
                Governance workflow
              </h2>

              <p>
                AI findings automatically enter the
                queue. Move each item through the
                decision lifecycle as your team
                reviews it.
              </p>
            </div>

            <div className="governance-workflow">
              <span>
                OPEN
              </span>

              <span>
                →
              </span>

              <span>
                IN REVIEW
              </span>

              <span>
                →
              </span>

              <span>
                APPROVED / REJECTED
              </span>

              <span>
                →
              </span>

              <span>
                RESOLVED
              </span>
            </div>
          </div>

          {/* DECISION QUEUE */}

          <div className="section-header governance-section-header">
            <div>
              <span className="eyebrow">
                AI DECISION QUEUE
              </span>

              <h2>
                Findings requiring governance
              </h2>

              <p>
                Prioritized by severity and current
                workflow status.
              </p>
            </div>

            <div className="findings-count">
              {activeItems.length}{" "}
              {activeItems.length ===
                1
                ? "active item"
                : "active items"}
            </div>
          </div>

          {sortedItems.length >
            0 ? (
            <div className="governance-queue">
              {sortedItems.map(
                (item) => (
                  <div
                    className={`panel governance-item governance-severity-${item.severity}`}
                    key={item.id}
                  >
                    <div className="governance-item-top">
                      <div className="governance-item-title">
                        <div className="governance-severity-icon">
                          {item.severity ===
                            "high"
                            ? "!"
                            : item.severity ===
                              "medium"
                              ? "◆"
                              : "•"}
                        </div>

                        <div>
                          <span className="finding-category">
                            {item.category}
                          </span>

                          <h3>
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <div className="governance-item-badges">
                        <span
                          className={`finding-severity ${item.severity}`}
                        >
                          {item.severity.toUpperCase()}
                        </span>

                        <span
                          className={`governance-status-badge status-${item.status
                            .toLowerCase()
                            .replace(
                              " ",
                              "-"
                            )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="governance-detected">
                      <span className="finding-label">
                        DETECTED CONTENT
                      </span>

                      <p>
                        {item.detectedText}
                      </p>
                    </div>

                    <div className="governance-detail-grid">
                      <div>
                        <span className="governance-detail-label">
                          WHY FLAGGED
                        </span>

                        <p>
                          {item.explanation}
                        </p>
                      </div>

                      <div>
                        <span className="governance-detail-label">
                          RECOMMENDED ACTION
                        </span>

                        <p>
                          {item.recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="governance-item-footer">
                      <div className="governance-source">
                        <span>
                          Source
                        </span>

                        <strong>
                          {item.source}
                        </strong>

                        <span>
                          {item.guidelineFilename}
                        </span>
                      </div>

                      <div className="governance-actions">
                        {item.status ===
                          "OPEN" && (
                            <button
                              className="secondary-button"
                              onClick={() =>
                                updateGovernanceStatus(
                                  item.id,
                                  "IN REVIEW"
                                )
                              }
                            >
                              Start Review
                            </button>
                          )}

                        {item.status ===
                          "IN REVIEW" && (
                            <>
                              <button
                                className="governance-approve-button"
                                onClick={() =>
                                  updateGovernanceStatus(
                                    item.id,
                                    "APPROVED"
                                  )
                                }
                              >
                                ✓ Approve
                              </button>

                              <button
                                className="governance-reject-button"
                                onClick={() =>
                                  updateGovernanceStatus(
                                    item.id,
                                    "REJECTED"
                                  )
                                }
                              >
                                ✕ Reject
                              </button>

                              <button
                                className="secondary-button"
                                onClick={() =>
                                  updateGovernanceStatus(
                                    item.id,
                                    "RESOLVED"
                                  )
                                }
                              >
                                Resolve
                              </button>
                            </>
                          )}

                        {item.status ===
                          "REJECTED" && (
                            <>
                              <button
                                className="secondary-button"
                                onClick={() =>
                                  updateGovernanceStatus(
                                    item.id,
                                    "OPEN"
                                  )
                                }
                              >
                                Reopen
                              </button>

                              <button
                                className="secondary-button"
                                onClick={() =>
                                  updateGovernanceStatus(
                                    item.id,
                                    "RESOLVED"
                                  )
                                }
                              >
                                Resolve
                              </button>
                            </>
                          )}

                        <button
                          className="secondary-button"
                          onClick={() =>
                            removeGovernanceItem(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="panel governance-empty-state">
              <div className="governance-empty-icon">
                ✓
              </div>

              <div>
                <span className="panel-kicker">
                  GOVERNANCE CLEAR
                </span>

                <h2>
                  No active governance
                  decisions.
                </h2>

                <p>
                  New AI Review findings will
                  automatically appear here when
                  they require governance attention.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "review"
                  )
                }
              >
                Run AI Review{" "}
                <span>→</span>
              </button>
            </div>
          )}

          {/* DECISION HISTORY */}

          <div className="section-header governance-history-header">
            <div>
              <span className="eyebrow">
                DECISION HISTORY
              </span>

              <h2>
                Resolved governance items
              </h2>

              <p>
                Completed decisions remain available
                as an audit-style prototype history.
              </p>
            </div>
          </div>

          <div className="governance-history-list">
            {governanceItems.filter(
              (item) =>
                item.status ===
                "RESOLVED" ||
                item.status ===
                "APPROVED" ||
                item.status ===
                "REJECTED"
            ).length >
              0 ? (
              governanceItems
                .filter(
                  (item) =>
                    item.status ===
                    "RESOLVED" ||
                    item.status ===
                    "APPROVED" ||
                    item.status ===
                    "REJECTED"
                )
                .slice(0, 10)
                .map((item) => (
                  <div
                    className="governance-history-row"
                    key={item.id}
                  >
                    <div className="governance-history-status">
                      {item.status ===
                        "APPROVED"
                        ? "✓"
                        : item.status ===
                          "REJECTED"
                          ? "✕"
                          : "✓"}
                    </div>

                    <div className="governance-history-content">
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.category} ·{" "}
                        {item.severity.toUpperCase()}{" "}
                        ·{" "}
                        {item.status}
                      </span>
                    </div>

                    <span className="governance-history-date">
                      {new Date(
                        item.updatedAt
                      ).toLocaleString()}
                    </span>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        updateGovernanceStatus(
                          item.id,
                          "OPEN"
                        )
                      }
                    >
                      Reopen
                    </button>
                  </div>
                ))
            ) : (
              <div className="panel governance-history-empty">
                <span>
                  No completed governance
                  decisions yet.
                </span>
              </div>
            )}
          </div>

          {/* ACTIVITY TIMELINE */}

          <div className="section-header governance-activity-header">
            <div>
              <span className="eyebrow">
                GOVERNANCE ACTIVITY
              </span>

              <h2>
                Decision activity timeline
              </h2>

              <p>
                Every governance transition is
                recorded locally for the prototype.
              </p>
            </div>
          </div>

          <div className="panel governance-activity-panel">
            <div className="governance-timeline">
              {governanceActivity
                .slice(0, 12)
                .map(
                  (
                    activity
                  ) => (
                    <div
                      className="governance-timeline-item"
                      key={
                        activity.id
                      }
                    >
                      <div
                        className={`governance-timeline-dot ${activity.type}`}
                      />

                      <div className="governance-timeline-content">
                        <strong>
                          {
                            activity.action
                          }
                        </strong>

                        <p>
                          {
                            activity.detail
                          }
                        </p>

                        <span>
                          {new Date(
                            activity.timestamp
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {/* GOVERNANCE INSIGHT */}

          <div className="panel brand-insight-panel">
            <div className="brand-insight-icon">
              ◆
            </div>

            <div className="brand-insight-content">
              <span className="panel-kicker">
                VARIETY GOVERNANCE
              </span>

              <h2>
                AI intelligence now becomes
                accountable workflow.
              </h2>

              <p>
                Every significant AI finding can
                move from detection to evidence
                validation and finally into a
                governance decision. This creates
                the foundation for enterprise
                approval workflows, audit trails
                and policy enforcement.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setActivePage(
                  "review"
                )
              }
            >
              Run New AI Review{" "}
              <span>→</span>
            </button>
          </div>
        </div>
      );
    };

  /* ============================================================
     ROUTER
  ============================================================ */

  const renderPage = () => {
    switch (activePage) {
      case "brand":
        return renderBrand();

      case "review":
        return renderReview();

      case "evidence":
        return renderEvidence();

      case "drift":
        return renderDrift();

      case "governance":
        return renderGovernance();

      case "history":
        return renderReviewHistory();


      case "settings":
        return (
          <div className="page-section settings-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  WORKSPACE CONTROL
                </span>

                <h1>Settings & Preferences</h1>

                <p>
                  Manage your account information and
                  personal workspace identity.
                </p>
              </div>

              <div className="studio-status">
                <span className="pulse-dot" />
                Account connected
              </div>
            </div>

            <div className="settings-profile-layout">
              <div className="panel settings-profile-card">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">
                      ACCOUNT PROFILE
                    </span>

                    <h2>Personal information</h2>
                  </div>

                  <span className="ai-chip">
                    ✦ ACCOUNT
                  </span>
                </div>

                <div className="settings-identity">
                  <div className="settings-avatar">
                    {(currentUser?.name || "U")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{currentUser?.name || "User"}</h3>
                    <p>{currentUser?.email || "No email available"}</p>
                    <span className="status-pill success">
                      Active account
                    </span>
                  </div>
                </div>

                <form
                  className="settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleProfileSave();
                  }}
                >
                  <div className="review-field">
                    <label htmlFor="profile-name">
                      Full name
                    </label>

                    <input
                      id="profile-name"
                      type="text"
                      value={profileName}
                      maxLength={100}
                      required
                      onChange={(event) => {
                        setProfileName(event.target.value);
                        setProfileError("");
                        setProfileSuccess("");
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="review-field">
                    <label htmlFor="profile-email">
                      Email address
                    </label>

                    <input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      maxLength={254}
                      required
                      onChange={(event) => {
                        setProfileEmail(event.target.value);
                        setProfileError("");
                        setProfileSuccess("");
                      }}
                      placeholder="Enter your email address"
                    />
                  </div>

                  {profileError && (
                    <div className="settings-message error" role="alert">
                      {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "14px 16px",
                        marginTop: "12px",
                        marginBottom: "12px",
                        borderRadius: "10px",
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(52, 211, 153, 0.4)",
                        color: "#6EE7B7",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: 1,
                        visibility: "visible"
                      }}
                      role="status"
                    >
                      ✓ {profileSuccess}
                    </div>
                  )}

                  <div className="settings-save-row">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={profileSaving}
                    >
                      {profileSaving
                        ? "Saving changes..."
                        : "Save Profile Changes"}
                      <span>→</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="settings-side-column">
                <div className="panel settings-account-card">
                  <span className="panel-kicker">
                    ACCOUNT INFORMATION
                  </span>

                  <h2>Account overview</h2>

                  <div className="settings-info-row">
                    <span>Account ID</span>
                    <strong>{currentUser?.id ?? "Unavailable"}</strong>
                  </div>

                  <div className="settings-info-row">
                    <span>Account role</span>
                    <strong>{currentUser?.role || "User"}</strong>
                  </div>

                  <div className="settings-info-row">
                    <span>Authentication</span>
                    <strong>Bearer token</strong>
                  </div>

                  <div className="settings-info-row">
                    <span>Session status</span>
                    <strong className="settings-active-text">
                      Connected
                    </strong>
                  </div>
                </div>

                <div className="panel settings-security-card">
                  <div className="settings-security-icon">
                    <span>◆</span>
                  </div>

                  <span className="panel-kicker">
                    ACCOUNT SECURITY
                  </span>

                  <h2>Your account is protected.</h2>

                  <p>
                    VARIETY AI uses authenticated sessions
                    to protect access to your workspace.
                    Keep your login credentials private.
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleLogout}
                  >
                    Sign Out of Account
                    <span>→</span>
                  </button>
                </div>
              </div>
              <div className="panel settings-sessions-card">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">
                      SESSION MANAGEMENT
                    </span>
                    <h2>Active Login Sessions</h2>
                  </div>

                  <span className="ai-chip">✦ SECURITY</span>
                </div>

                {sessionsLoading && (
                  <p className="settings-session-muted">
                    Loading active sessions...
                  </p>
                )}

                {sessionsError && (
                  <div className="settings-message error" role="alert">
                    {sessionsError}
                  </div>
                )}

                {sessionsMessage && (
                  <div className="settings-session-success" role="status">
                    ✓ {sessionsMessage}
                  </div>
                )}

                {!sessionsLoading && activeSessions.length === 0 && !sessionsError && (
                  <p className="settings-session-muted">
                    No active sessions found.
                  </p>
                )}

                {activeSessions.map((session, index) => (
                  <div className="settings-session-row" key={`${session.created_at}-${index}`}>
                    <div className="settings-session-device">
                      <strong>
                        {session.is_current ? "Current Session" : "Active Session"}
                      </strong>

                      <span>
                        {session.user_agent || "Device information unavailable"}
                      </span>

                      <span>
                        IP address: {session.ip_address || "Unavailable"}
                      </span>

                      <span>
                        Signed in:{" "}
                        {session.created_at
                          ? new Date(session.created_at).toLocaleString()
                          : "Unavailable"}
                      </span>
                    </div>

                    {session.is_current && (
                      <span className="settings-session-current">
                        CURRENT
                      </span>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="secondary-button settings-revoke-button"
                  onClick={handleRevokeOtherSessions}
                  disabled={revokingSessions || activeSessions.filter(
                    (session) => !session.is_current
                  ).length === 0}
                >
                  {revokingSessions
                    ? "Signing Out Other Sessions..."
                    : "Sign Out Other Sessions"}
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="panel settings-password-card">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">
                    PASSWORD & LOGIN SECURITY
                  </span>
                  <h2>Change Your Password</h2>
                  <p>
                    Keep your account secure by updating your login password.
                  </p>
                </div>

                <span className="ai-chip">✦ SECURITY</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handlePasswordChange();
                }}
              >

                <div className="settings-password-field">
                  <label>Current Password</label>
                  <div className="settings-password-input">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="settings-password-field">
                  <label>New Password</label>
                  <div className="settings-password-input">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="password-strength">
                      <div className="password-strength-track">
                        <div
                          className={`password-strength-fill strength-${passwordStrengthLabel.toLowerCase()}`}
                          style={{
                            width: `${passwordStrengthScore * 20}%`,
                          }}
                        />
                      </div>
                      <span>
                        Password strength: <strong>{passwordStrengthLabel}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="settings-password-field">
                  <label>Confirm New Password</label>
                  <div className="settings-password-input">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>


                {passwordError && (
                  <div className="settings-message error" role="alert">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="settings-message success" role="status">
                    {passwordSuccess}
                  </div>
                )}

                <div className="settings-save-row">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? "Updating Password..." : "Update Password"}
                    <span>→</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="panel settings-notifications-card">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">
                    NOTIFICATION CENTRE
                  </span>
                  <h2>Notification Preferences</h2>
                  <p>
                    Choose which updates and alerts you want to keep enabled.
                  </p>
                </div>

                <span className="ai-chip">✦ PREFERENCES</span>
              </div>

              {[
                {
                  key: "review_alerts",
                  title: "AI Review Alerts",
                  description: "Updates related to AI review analysis and results.",
                },
                {
                  key: "evidence_alerts",
                  title: "Evidence Intelligence",
                  description: "Updates about evidence tracking and verification.",
                },
                {
                  key: "security_alerts",
                  title: "Security Notifications",
                  description: "Important account and security-related alerts.",
                },
                {
                  key: "product_updates",
                  title: "Product Updates",
                  description: "New features, improvements and platform announcements.",
                },
              ].map((item) => (
                <div className="settings-notification-row" key={item.key}>
                  <div className="settings-notification-info">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>

                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={notificationPreferences[item.key]}
                      onChange={(event) => {
                        const updatedPreferences = {
                          ...notificationPreferences,
                          [item.key]: event.target.checked,
                        };

                        setNotificationPreferences(updatedPreferences);
                        saveNotificationPreferences(updatedPreferences);
                      }}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>

          </div>
        );




      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  /* ============================================================
     APP SHELL
  ============================================================ */

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b1020",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif"
      }}>
        Verifying your session...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#0b1020",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif"
      }}>
        <form
          onSubmit={showRegister ? handleRegister : handleLogin}
          style={{
            width: "100%",
            maxWidth: "420px",
            boxSizing: "border-box",
            padding: "32px",
            borderRadius: "16px",
            background: "#151c30",
            border: "1px solid #303a52"
          }}
        >
          <div style={{
            fontSize: "13px",
            letterSpacing: "4px",
            color: "#8da8ff",
            marginBottom: "12px"
          }}>
            BRAND TRUST COMPILER
          </div>

          <h1 style={{ margin: "0 0 8px", fontSize: "30px" }}>
            VARIETY AI
          </h1>

          <p style={{ color: "#aab5ca", marginBottom: "28px" }}>
            {showRegister
              ? "Create your account to access the brand governance workspace."
              : "Sign in to your brand governance workspace."}
          </p>

          {showRegister ? (
            <>
              <label
                htmlFor="register-name"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Full name
              </label>

              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Your full name"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  border: "1px solid #3b4760",
                  background: "#0b1020",
                  color: "#ffffff"
                }}
              />

              <label
                htmlFor="register-email"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Email address
              </label>

              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  border: "1px solid #3b4760",
                  background: "#0b1020",
                  color: "#ffffff"
                }}
              />

              <label
                htmlFor="register-password"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Password (at least 12 characters)
              </label>

              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Create a strong password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "8px",
                  border: "1px solid #3b4760",
                  background: "#0b1020",
                  color: "#ffffff"
                }}
              />
            </>
          ) : (
            <>
              <label
                htmlFor="login-email"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  border: "1px solid #3b4760",
                  background: "#0b1020",
                  color: "#ffffff"
                }}
              />

              <label
                htmlFor="login-password"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "8px",
                  border: "1px solid #3b4760",
                  background: "#0b1020",
                  color: "#ffffff"
                }}
              />

            </>
          )}

          {registerMessage && (
            <div
              role="status"
              style={{
                color: "#9be7b0",
                fontSize: "14px",
                marginBottom: "16px"
              }}
            >
              {registerMessage}
            </div>
          )}

          {authError && (
            <div
              role="alert"
              style={{
                color: "#ff9b9b",
                fontSize: "14px",
                marginBottom: "16px"
              }}
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={showRegister ? registerLoading : loginLoading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: "#6685ff",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loginLoading ? "wait" : "pointer",
              opacity: loginLoading ? 0.7 : 1
            }}
          >
            {showRegister
              ? (registerLoading ? "Creating account..." : "Create Account")
              : (loginLoading ? "Signing in..." : "Sign In")}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowRegister((current) => !current);
              setAuthError("");
              setRegisterMessage("");
            }}
            style={{
              width: "100%",
              padding: "11px",
              marginTop: "12px",
              border: "1px solid #3b4760",
              borderRadius: "8px",
              background: "transparent",
              color: "#aab5ca",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            {showRegister
              ? "Already have an account? Sign In"
              : "New here? Create Account"}
          </button>

          <p style={{
            color: "#8995ad",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "20px"
          }}>
            Secure access to your brand governance platform
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <div className="brand-mark">
            <span>V</span>
          </div>

          <div>
            <strong className="brand-name">
              VARIETY AI
            </strong>

            <span className="brand-subtitle">
              AI Review Studio
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? "×" : "☰"}
        </button>
      </header>
      <div
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? "open" : ""
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      {createPortal(
        <aside
          className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""
            }`}
        >
          <div className="brand-logo">
            <div className="brand-mark">
              <span>V</span>
            </div>

            <div>
              <strong>
                VARIETY
              </strong>

              <span>
                AI
              </span>
            </div>
          </div>

          <div className="workspace">
            <span className="workspace-label">
              WORKSPACE
            </span>

            <div className="workspace-card">
              <div className="workspace-avatar">
                A
              </div>

              <div>
                <strong>
                  Acme Corporation
                </strong>

                <span>
                  Enterprise workspace
                </span>
              </div>

              <span className="workspace-arrow">
                ⌄
              </span>
            </div>
          </div>

          <nav className="main-nav">
            <span className="nav-label">
              INTELLIGENCE
            </span>

            {navItems.map(
              (item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activePage ===
                    item.id
                    ? "active"
                    : ""
                    }`}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>

                  {item.id ===
                    "review" && (
                      <span className="nav-notification">
                        {reviewResult &&
                          reviewResult.review_status !==
                          "ERROR"
                          ? reviewResult.total_violations ||
                          0
                          : 3}
                      </span>
                    )}

                  {item.id ===
                    "drift" &&
                    overallHealthAlertCount(
                      healthAlerts
                    ) >
                    0 && (
                      <span className="nav-notification">
                        {overallHealthAlertCount(
                          healthAlerts
                        )}
                      </span>
                    )}

                  {/* STAGE 9 GOVERNANCE BADGE */}

                  {item.id ===
                    "governance" &&
                    governanceMetrics.active >
                    0 && (
                      <span className="nav-notification governance-nav-notification">
                        {governanceMetrics.active}
                      </span>
                    )}
                </button>
              )
            )}
          </nav>

          <div className="sidebar-bottom">
            <div className="upgrade-card">
              <div className="upgrade-icon">
                ✦
              </div>

              <strong>
                VARIETY Intelligence
              </strong>

              <p>
                Advanced brand protection is
                active.
              </p>

              <div className="upgrade-progress">
                <span
                  style={{
                    width: `${currentHealth.score}%`,
                  }}
                />
              </div>

              <small>
                {currentHealth.score}%
                health score
              </small>
            </div>

            <button
              className={`settings-button ${activePage === "settings" ? "active" : ""
                }`}
              onClick={() => {
                setActivePage("settings");
                setMobileMenuOpen(false);
              }}
            >
              <span>⚙</span>
              Settings
            </button>

            <div className="user-card">
              <div className="user-avatar">
                AS
              </div>

              <div>
                <strong>
                  Aditya Sandeep
                </strong>

                <span>
                  Administrator
                </span>
              </div>

              <span>
                ⋮
              </span>
            </div>
          </div>
          <div style={{
            padding: "16px",
            marginTop: "16px",
            borderTop: "1px solid #303a52"
          }}>
            <div style={{
              color: "#aab5ca",
              fontSize: "13px",
              marginBottom: "10px",
              overflowWrap: "anywhere"
            }}>
              Signed in as {currentUser?.name || currentUser?.email}
              <br />
              Role: {currentUser?.role || "User"}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #52607a",
                background: "transparent",
                color: "#ffffff",
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>,
        document.body
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>
              VARIETY AI
            </span>

            <span>
              /
            </span>

            <strong>
              {navItems.find((item) => item.id === activePage)?.label || "Command Center"}
            </strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <span>
                ⌕
              </span>

              <input
                placeholder="Search intelligence..."
              />

              <kbd>
                ⌘ K
              </kbd>
            </div>

            <button className="icon-button">
              ⌁
            </button>

            <div className="notification-wrapper">
              <button
                className="icon-button notification-button"
                onClick={() => {
                  setShowNotifications((previous) => !previous);

                  if (!showNotifications) {
                    loadNotifications();
                  }
                }}
                aria-label="Notifications"
              >
                ♢

                {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">

                  <div className="notification-dropdown-header">
                    <div>
                      <h3>Notifications</h3>
                      <span>
                        {unreadNotificationCount} unread
                      </span>
                    </div>

                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="mark-all-read"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">

                    {notificationsLoading ? (
                      <div className="notification-empty">
                        Loading notifications...
                      </div>
                    ) : notifications.filter(
                      (notification) => !notification.is_read
                    ).length === 0 ? (
                      <div className="notification-empty">
                        <span>♢</span>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications
                        .filter((notification) => !notification.is_read)
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${notification.is_read
                              ? "read"
                              : "unread"
                              }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markNotificationAsRead(
                                  notification.id
                                );
                              }
                            }}
                          >
                            <div className="notification-item-icon">
                              {notification.category === "review"
                                ? "✦"
                                : "♢"}
                            </div>

                            <div className="notification-item-content">
                              <strong>
                                {notification.title}
                              </strong>

                              <p>
                                {notification.message}
                              </p>

                              <small>
                                {notification.created_at
                                  ? new Date(
                                    notification.created_at
                                  ).toLocaleString()
                                  : ""}
                              </small>
                            </div>

                            {!notification.is_read && (
                              <span className="notification-unread-dot" />
                            )}
                          </div>
                        ))
                    )}

                  </div>
                </div>
              )}
            </div>

            <div className="top-user">
              <div className="user-avatar">
                AS
              </div>

              <span>
                ⌄
              </span>
            </div>
          </div>
        </header>

        <div className="content">
          {renderPage()}
        </div>

        <footer className="footer">
          <span>
            VARIETY AI Intelligence Platform
          </span>

          <span>
            <i />
            All systems operational
          </span>

          <span>
            v1.0.0
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
