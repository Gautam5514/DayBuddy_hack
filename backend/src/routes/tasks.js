const { Router } = require("express");
const store = require("../storage");
const { notFound } = require("../errors");
const { createTaskSchema, updateTaskSchema } = require("../schemas");

const router = Router();

router.get("/", async (req, res) => {
  const tasks = await store.listTasks(req.userId);
  res.json({ success: true, tasks });
});

router.post("/", async (req, res) => {
  const { label } = createTaskSchema.parse(req.body ?? {});
  const task = await store.addTask(req.userId, label);
  res.status(201).json({ success: true, task });
});

router.patch("/:id", async (req, res) => {
  const patch = updateTaskSchema.parse(req.body ?? {});
  const task = await store.updateTask(req.userId, req.params.id, patch);
  if (!task) throw notFound("Task");
  res.json({ success: true, task });
});

router.delete("/:id", async (req, res) => {
  const deleted = await store.deleteTask(req.userId, req.params.id);
  if (!deleted) throw notFound("Task");
  res.json({ success: true });
});

module.exports = router;
