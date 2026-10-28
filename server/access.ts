import type { Pool } from "pg";
import type { Request, Response, NextFunction } from "express";
export function createAccess(pool: Pool) {
  async function auth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId)
      return res.status(401).json({ error: "Authentication required" });
    const user = (
      await pool.query(
        "SELECT id,role,active FROM users WHERE id=$1 AND active=TRUE",
        [req.session.userId],
      )
    ).rows[0];
    if (!user)
      return res.status(401).json({ error: "Account is disabled or deleted" });
    if (
      user.role === "viewer" &&
      !["GET", "HEAD"].includes(req.method) &&
      req.path !== "/api/auth/password"
    )
      return res.status(403).json({ error: "Viewer accounts are read-only" });
    (req as any).novaUser = user;
    next();
  }
  async function admin(req: Request, res: Response, next: NextFunction) {
    return auth(req, res, () => {
      if ((req as any).novaUser.role !== "admin")
        return res.status(403).json({ error: "Administrator access required" });
      next();
    });
  }
  async function control(req: Request, res: Response, next: NextFunction) {
    return auth(req, res, () => {
      if ((req as any).novaUser.role === "viewer")
        return res
          .status(403)
          .json({ error: "Operator or administrator access required" });
      next();
    });
  }
  return { auth, admin, control };
}
