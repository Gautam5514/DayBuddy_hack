// In-memory implementation of the store interface (see ./index.js).
// Used when MongoDB is unreachable, and in tests. Data lives until restart.

const { randomUUID } = require("node:crypto");
const { toPrefs, toTask, toCheckin } = require("./mappers");

function createMemoryStore() {
  const prefsByUser = new Map(); // userId -> prefs
  const tasksByUser = new Map(); // userId -> task[] (oldest first)
  const checkinsByUser = new Map(); // userId -> checkin[] (newest first)

  const tasksOf = (userId) => {
    if (!tasksByUser.has(userId)) tasksByUser.set(userId, []);
    return tasksByUser.get(userId);
  };

  const checkinsOf = (userId) => {
    if (!checkinsByUser.has(userId)) checkinsByUser.set(userId, []);
    return checkinsByUser.get(userId);
  };

  return {
    async getPrefs(userId) {
      return toPrefs(prefsByUser.get(userId));
    },

    async savePrefs(userId, prefs) {
      const next = { ...prefsByUser.get(userId), ...prefs };
      prefsByUser.set(userId, next);
      return toPrefs(next);
    },

    async listTasks(userId) {
      return tasksOf(userId).map(toTask);
    },

    async addTask(userId, label) {
      const task = { id: randomUUID(), label, done: false };
      tasksOf(userId).push(task);
      return toTask(task);
    },

    async updateTask(userId, id, patch) {
      const task = tasksOf(userId).find((t) => t.id === id);
      if (!task) return null;
      Object.assign(task, patch);
      return toTask(task);
    },

    async deleteTask(userId, id) {
      const tasks = tasksOf(userId);
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      tasks.splice(index, 1);
      return true;
    },

    async addCheckin(userId, checkin) {
      const record = { ...checkin, createdAt: new Date() };
      checkinsOf(userId).unshift(record);
      return toCheckin(record);
    },

    async listCheckins(userId, limit) {
      return checkinsOf(userId).slice(0, limit).map(toCheckin);
    },
  };
}

module.exports = { createMemoryStore };
