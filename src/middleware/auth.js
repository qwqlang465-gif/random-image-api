export function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.redirect(`${req.adminPath}/login`);
}

export function attachAdminPath(adminPath) {
  return (req, res, next) => {
    req.adminPath = adminPath;
    next();
  };
}
