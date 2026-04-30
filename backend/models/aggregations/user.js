const AggregationBuilder = require("./index");
const User = require("@models/user");

class AggregationHelperUser {
  static getSuggestions(excludeIds, followingIds, limit) {
    return new AggregationBuilder(User)
      .match({
        _id: { $nin: excludeIds },
        deactived: false,
      })
      .lookup({
        from: "follows",
        let: { potentialUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$following", "$$potentialUserId"] },
                  { $in: ["$follower", followingIds] },
                ],
              },
            },
          },
        ],
        as: "mutualConnections",
      })
      .addFields({
        mutualCount: { $size: "$mutualConnections" },
      })
      .sort({ mutualCount: -1, followersCount: -1 })
      .limit(20)
      .sample({ size: Number(limit) })
      .project({
        _id: 1,
        username: 1,
        avatar: 1,
        bio: 1,
        followersCount: 1,
        mutualCount: 1,
      })
      .exec();
  }
}

module.exports = AggregationHelperUser;
