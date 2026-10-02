// Resolves who the request is for. Today that is always the single demo user;
// when auth lands, only this middleware has to change — routes read `req.userId`.
function currentUser(userId) {
  return (req, res, next) => {
    req.userId = userId;
    next();
  };
}

module.exports = { currentUser };
