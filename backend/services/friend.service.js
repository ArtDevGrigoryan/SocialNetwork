const follow = require("@models/transactions/follow");
const unfollow = require("@models/transactions/unfollow");
const cancelRequest = require("@models/transactions/cancel-request");
const acceptRequest = require("@models/transactions/accept-request");
const declineRequest = require("@models/transactions/decline-request");
const { SocketConflictException } = require("@helpers/socket-errors");

class FriendService {
  follow(sender, receiver) {
    console.log(sender.toString(), receiver);
    if (sender.toString() == receiver) {
      throw new SocketConflictException("");
    }
    return follow(sender, receiver);
  }
  accept(sender, receiver) {
    return acceptRequest(sender, receiver);
  }
  decline(sender, receiver) {
    return declineRequest(sender, receiver);
  }
  cancel(sender, receiver) {
    return cancelRequest(sender, receiver);
  }
  unfollow(myId, targetId) {
    return unfollow(myId, targetId);
  }
}

module.exports = new FriendService();
