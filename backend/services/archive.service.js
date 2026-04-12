const { NotFoundException, ForBiddenException } = require("@helpers/errors");
const mediaService = require("@lib/media.service");
const Archive = require("@models/archive");

class ArchiveService {
  async archiveds(userId, pagination = {}) {
    const { cursor, limit = 20 } = pagination;

    const query = {
      user: userId,
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const items = await Archive.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
    };
  }
  async getUnique(userId, archivedId) {
    const archived = await Archive.findById(archivedId).lean();

    if (!archived) {
      throw new NotFoundException("Archived not found");
    }
    if (archived.user.toString() != userId) {
      throw new ForBiddenException("Cannot access this archived entity");
    }
    return archived;
  }
  async remove(userId, archivedId) {
    const archived = await Archive.findById(archivedId).lean();
    if (!archived) {
      throw new NotFoundException("Archived not found");
    }
    if (archived.user.toString() != userId) {
      throw new ForBiddenException("Cannot access this archived entity");
    }
    const key = archived.media.key;
    if (key) await mediaService.delete([key]);
    await Archive.deleteOne({ _id: archivedId, user: userId });
  }
}

module.exports = new ArchiveService();
