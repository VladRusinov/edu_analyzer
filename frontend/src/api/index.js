const API_BASE = "http://localhost:8000/api";

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("access_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; 
  }
  return headers;
}

function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status === 204) {
    return null; 
  }
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function apiPost(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function apiPatch(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
