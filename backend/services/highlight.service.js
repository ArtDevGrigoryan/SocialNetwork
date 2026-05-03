const Highlight = require("@models/highlight");
const StoryArchive = require("@models/archive");
const PolicyService = require("@services/policy.service");
const {
  NotFoundException,
  ForBiddenException,
  BadRequestException,
} = require("@helpers/errors");

class HighlightService {
  async create(userId, data) {
    const { title, cover, archives } = data;
    const existingArchives = await StoryArchive.find({
      _id: { $in: archives },
      user: userId,
    }).lean();

    if (existingArchives.length !== archives.length) {
      throw new BadRequestException(
        "Some selected stories are invalid or do not belong to you.",
      );
    }

    const highlight = await Highlight.create({
      user: userId,
      title: title || "Highlights",
      cover,
      archives,
    });
    return highlight;
  }

  async update(userId, highlightId, data) {
    const highlight = await Highlight.findById(highlightId);
    if (!highlight) {
      throw new NotFoundException("Highlight not found");
    }
    if (highlight.user.toString() !== userId.toString()) {
      throw new ForBiddenException("Cannot edit this highlight");
    }

    if (data.title) highlight.title = data.title;
    if (data.cover) highlight.cover = data.cover;
    if (data.archives) {
      const existingArchives = await StoryArchive.find({
        _id: { $in: data.archives },
        user: userId,
      }).lean();
      if (existingArchives.length !== data.archives.length) {
        throw new BadRequestException("Invalid stories selected.");
      }
      highlight.archives = data.archives;
    }

    await highlight.save();
    return highlight;
  }

  async getUserHighlights(viewerId, targetUserId) {
    await PolicyService.canViewProfile(viewerId, targetUserId);
    return Highlight.find({ user: targetUserId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getHighlight(viewerId, highlightId) {
    const highlight = await Highlight.findById(highlightId)
      .populate("archives")
      .lean();
    if (!highlight) {
      throw new NotFoundException("Highlight not found");
    }
    await PolicyService.canViewProfile(viewerId, highlight.user);
    return highlight;
  }

  async remove(userId, highlightId) {
    const highlight = await Highlight.findById(highlightId);
    if (!highlight) throw new NotFoundException("Highlight not found");
    if (highlight.user.toString() !== userId.toString()) {
      throw new ForBiddenException("Cannot delete this highlight");
    }
    await highlight.deleteOne();
    return true;
  }
}

module.exports = new HighlightService();
