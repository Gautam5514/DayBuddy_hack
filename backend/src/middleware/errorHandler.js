const { ZodError } = require("zod");
const { HttpError } = require("../errors");

// Unknown routes get a JSON 404 instead of Express's HTML page.
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Cannot ${req.method} ${req.path}` });
}

// Express 5 forwards rejected promises from async handlers here automatically,
// so routes can simply `throw`. Every error leaves as the same JSON shape.
// Express recognises an error handler by its four parameters, hence the unused `_next`.
function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Invalid request",
      details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  // Malformed JSON body, oversized payload, etc. from express.json().
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  console.error("[error]", err);
  return res.status(500).json({ success: false, error: "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
