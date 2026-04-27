export interface ISettings {
  notifications: {
    accept_request: boolean;
    decline_request: boolean;
    cancel_request: boolean;
    follow: boolean;
    unfollow: boolean;
    group_member_removed: boolean;
    group_removed: boolean;
    group_member_removed_notice: boolean;
    message: boolean;
    newGroup: boolean;
  };
  privacy: {
    profileVisibility: "PUBLIC" | "PRIVATE";
    showTyping: boolean;
  };
}

export type NotificationType = keyof ISettings["notifications"];
