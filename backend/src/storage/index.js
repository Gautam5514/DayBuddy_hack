// Repository facade. Routes talk to this object only; each call is routed to
// MongoDB while it is connected and to the in-memory store otherwise, so the
// app keeps working through a database outage.
//
// Store interface (all methods async, all scoped by userId):
//   getPrefs, savePrefs, listTasks, addTask, updateTask, deleteTask,
//   addCheckin, listCheckins

const { isConnected } = require("./connection");
const { mongoStore } = require("./mongoStore");
const { createMemoryStore } = require("./memoryStore");
const { LIMITS } = require("../constants");

const memoryStore = createMemoryStore();
const active = () => (isConnected() ? mongoStore : memoryStore);

const store = {
  getPrefs: (userId) => active().getPrefs(userId),
  savePrefs: (userId, prefs) => active().savePrefs(userId, prefs),

  listTasks: (userId) => active().listTasks(userId),
  addTask: (userId, label) => active().addTask(userId, label),
  updateTask: (userId, id, patch) => active().updateTask(userId, id, patch),
  deleteTask: (userId, id) => active().deleteTask(userId, id),

  addCheckin: (userId, checkin) => active().addCheckin(userId, checkin),
  listCheckins: (userId, limit = LIMITS.checkinHistoryDefault) =>
    active().listCheckins(userId, limit),
  async latestCheckin(userId) {
    const [latest] = await active().listCheckins(userId, 1);
    return latest ?? null;
  },

  storageMode: () => (isConnected() ? "mongodb" : "in-memory"),
};

module.exports = store;
