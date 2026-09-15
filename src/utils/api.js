/**
 * Thin fetch() wrapper around the Express task/list routes.
 */
import { API_BASE_URL, API_USER_ID } from '@/utils/config';

let currentUserId = API_USER_ID;

export function setApiUserId(id) {
  const parsed = Number(id);
  currentUserId = Number.isFinite(parsed) && parsed > 0 ? parsed : API_USER_ID;
}

function userId() {
  return currentUserId;
}

const NETWORK_ERROR =
  'Cannot reach the server. Make sure the backend is running and this phone is on the same Wi‑Fi.';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed (${response.status})`);
  }

  return data;
}

export function getTasks() {
  return request(`/tasks?user_id=${userId()}`);
}

export function createTask(task) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId(), ...task }),
  });
}

export function updateTask(id, updates) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export function getLists() {
  return request(`/lists?user_id=${userId()}`);
}

export function createList(list) {
  return request('/lists', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId(), ...list }),
  });
}

export function deleteList(id) {
  return request(`/lists/${id}`, { method: 'DELETE' });
}

export function updateList(id, updates) {
  return request(`/lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function loginUser(name) {
  return request('/users/login', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
