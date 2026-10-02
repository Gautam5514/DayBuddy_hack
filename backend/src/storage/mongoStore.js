// MongoDB implementation of the store interface (see ./index.js).

const mongoose = require("mongoose");
const { Preferences, Task, Checkin } = require("./models");
const { toPrefs, toTask, toCheckin } = require("./mappers");

// A malformed id can never match, so answer "not found" instead of throwing a CastError.
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const mongoStore = {
  async getPrefs(userId) {
    return toPrefs(await Preferences.findOne({ userId }).lean());
  },

  async savePrefs(userId, prefs) {
    const doc = await Preferences.findOneAndUpdate(
      { userId },
      { $set: { ...prefs, userId } },
      { returnDocument: "after", upsert: true, runValidators: true }
    ).lean();
    return toPrefs(doc);
  },

  async listTasks(userId) {
    const docs = await Task.find({ userId }).sort({ createdAt: 1 }).lean();
    return docs.map(toTask);
  },

  async addTask(userId, label) {
    return toTask(await Task.create({ userId, label }));
  },

  async updateTask(userId, id, patch) {
    if (!isValidId(id)) return null;
    const doc = await Task.findOneAndUpdate(
      { _id: id, userId },
      { $set: patch },
      { returnDocument: "after", runValidators: true }
    ).lean();
    return doc ? toTask(doc) : null;
  },

  async deleteTask(userId, id) {
    if (!isValidId(id)) return false;
    const { deletedCount } = await Task.deleteOne({ _id: id, userId });
    return deletedCount > 0;
  },

  async addCheckin(userId, checkin) {
    return toCheckin(await Checkin.create({ userId, ...checkin }));
  },

  async listCheckins(userId, limit) {
    const docs = await Checkin.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(toCheckin);
  },
};

module.exports = { mongoStore };
