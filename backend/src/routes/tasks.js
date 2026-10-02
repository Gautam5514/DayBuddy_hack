const { Router } = require("express");
const store = require("../storage");
const { notFound } = require("../errors");
const { createTaskSchema, updateTaskSchema, taskListQuerySchema } = require("../schemas");

const router = Router();
const todayUtc = () => new Date().toISOString().slice(0, 10);

router.get("/", async (req, res) => {
  const { date } = taskListQuerySchema.parse(req.query);
  const tasks = await store.listTasks(req.userId);
  const visibleTasks = date ? tasks.filter((task) => !task.done || task.doneAt === date) : tasks;
  res.json({ success: true, tasks: visibleTasks });
});

router.post("/", async (req, res) => {
  const { label } = createTaskSchema.parse(req.body ?? {});
  const task = await store.addTask(req.userId, label);
  res.status(201).json({ success: true, task });
});

router.patch("/:id", async (req, res) => {
  const { date, ...patch } = updateTaskSchema.parse(req.body ?? {});
  if (patch.done === true) patch.doneAt = date ?? todayUtc();
  if (patch.done === false) patch.doneAt = null;
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
