// generic utility helpers used across the application

export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const getBackendUrl = () => {
  let url = "";
  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  } else if (import.meta.env.VITE_API_BASE_URL) {
    url = import.meta.env.VITE_API_BASE_URL;
  } else {
    const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "localhost";
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      url = "/api";
    } else {
      url = "/api";
    }
  }

  if (url) {
    // Remove any trailing slashes
    url = url.replace(/\/+$/, "");
    // Ensure it ends with /api
    if (!url.endsWith("/api")) {
      url = `${url}/api`;
    }
  }
  return url;
};

export const getWebSocketUrl = () => {
  const backendUrl = getBackendUrl();
  // Strip trailing '/api' from base URL if present to construct the correct WebSocket handshake path
  const base = backendUrl.endsWith("/api") ? backendUrl.slice(0, -4) : backendUrl;
  return `${base}/ws`;
};

export const stripHtml = (html = "") => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Resolves a media URL to an absolute URL.
 * When Cloudinary is not configured, the backend saves images locally and
 * returns relative paths like "/uploads/uuid.jpg". These must be resolved
 * against the backend base URL, not the frontend origin.
 */
export const resolveMediaUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined') return null;
  // Already absolute URL (Cloudinary, Unsplash, etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path from local fallback — prefix with backend base URL (strip /api suffix)
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    let backendBase = getBackendUrl().replace(/\/api$/, '');
    if (!backendBase && typeof window !== "undefined") {
      // Relative API URLs use the same-origin uploads proxy, including custom local backend ports.
      backendBase = window.location.origin;
    }
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};

/**
 * Maps database icon identifiers (like "water_drop", "school", "forest")
 * to modern, accessible emojis or visual symbols for consistent UI rendering.
 */
export const resolveIconEmoji = (icon) => {
  if (!icon) return "📊";
  const name = icon.toLowerCase().trim();
  switch (name) {
    case "water":
    case "water_drop":
    case "waterdrop":
    case "💧":
      return "💧";
    case "school":
    case "education":
    case "students":
    case "student":
    case "🎓":
    case "🏫":
      return "🎓";
    case "trees":
    case "tree":
    case "forest":
    case "saplings":
    case "sapling":
    case "🌱":
    case "🌳":
      return "🌳";
    default:
      return icon;
  }
};

/**
 * Utility helper to set page-specific SEO parameters dynamically in React.
 */
export const updatePageSEO = (title, description, path = "", noindex = false) => {
  if (typeof document === "undefined") return;

  const fullTitle = `${title} | K.V.G. Shanmuka Sai Charitable Trust`;
  document.title = fullTitle;

  const updateMeta = (name, content, attr = "name") => {
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  updateMeta("description", description);
  updateMeta("og:title", fullTitle, "property");
  updateMeta("og:description", description, "property");
  updateMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
  
  const fullUrl = `https://shanmukasaitrust.org${path}`;
  updateMeta("og:url", fullUrl, "property");

  let canonical = document.querySelector("link[rel='canonical']");
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", fullUrl);
};
