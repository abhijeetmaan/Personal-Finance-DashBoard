import { AuditLog } from "../models/AuditLog.js";

/**
 * @param {object} params
 * @param {string} params.action
 * @param {string} params.entityType
 * @param {import("mongoose").Types.ObjectId|string|null} [params.entityId]
 * @param {import("mongoose").Types.ObjectId|string|null} [params.userId]
 * @param {object} [params.metadata]
 */
export async function recordAuditLog({
  action,
  entityType,
  entityId = null,
  userId = null,
  metadata = {},
}) {
  try {
    await AuditLog.create({
      action: String(action || "").slice(0, 120),
      entityType: String(entityType || "").slice(0, 80),
      entityId: entityId || null,
      userId: userId || null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });
  } catch {
    // Never fail primary operations on audit write errors
  }
}
