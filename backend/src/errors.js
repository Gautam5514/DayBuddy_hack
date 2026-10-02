// An error that already knows which HTTP status it should produce.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);

module.exports = { HttpError, notFound };
