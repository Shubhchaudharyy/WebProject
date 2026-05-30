const API_BASE =
  (window.SHOPVERSE_API_URL || "").replace(/\/$/, "") ||
  (location.protocol === "file:" ? "http://localhost:3000" : location.origin);

async function apiFetch(path, options = {}) {
  if (API_BASE.includes("your-shopverse-backend-url.com")) {
    throw new Error(
      "Backend URL is not configured. Update api-config.js with your deployed backend URL."
    );
  }

  let response;

  try {
    response = await fetch(API_BASE + path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      "Backend API is not reachable. Start the Node server with npm start, or set api-config.js to your deployed backend URL."
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
