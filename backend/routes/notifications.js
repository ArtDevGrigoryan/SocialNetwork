const router = require("express").Router();
const { z } = require("zod");
const notificationsController = require("@controllers/notifications");
const validate = require("@middlewares/validate");
const { idSchema, paginationSchema } = require("@schemas/common.schema");

const notificationIdParams = [{ params: z.object({ id: idSchema }) }];
const pagination = [{ query: paginationSchema }, { defaults: true }];

router.get("/", validate(pagination), notificationsController.list);
router.get("/unread-count", notificationsController.unread);
router.patch("/mark-all-read", notificationsController.markAllRead);
router.patch("/:id/read", validate(notificationIdParams), notificationsController.markRead);

module.exports = router;
