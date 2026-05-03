import { secureStorage } from './secureStorage.js';
const STORAGE_KEY = 'whiz-milestone-reminders';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function loadReminderState(storage = secureStorage.raw) {
  return safeParse(storage.getItem(STORAGE_KEY));
}

export function saveReminderState(state, storage = secureStorage.raw) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state || {}));
}

export function acknowledgeReminder({ id, quarterKey, storage = secureStorage.raw }) {
  const state = loadReminderState(storage);
  const prev = state[quarterKey] || {};
  state[quarterKey] = { ...prev, [id]: { ...(prev[id] || {}), acknowledged: true, snoozedUntil: null } };
  saveReminderState(state, storage);
  return state;
}

export function snoozeReminder({ id, quarterKey, snoozedUntil, storage = secureStorage.raw }) {
  const state = loadReminderState(storage);
  const prev = state[quarterKey] || {};
  state[quarterKey] = { ...prev, [id]: { ...(prev[id] || {}), acknowledged: false, snoozedUntil } };
  saveReminderState(state, storage);
  return state;
}
