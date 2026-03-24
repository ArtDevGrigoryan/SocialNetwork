const { OAuth2Client } = require("google-auth-library");
const stateStore = require("@services/oauth-state.store");
const env = require("@helpers/env");

class GoogleOAuthProvider {
  constructor() {
    this.client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_OAUTH_REDIRECT_URL,
    );
  }

  getAuthUrl() {
    const state = stateStore.generate();

    const url = this.client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      prompt: "consent",
      state,
    });

    return { url, state };
  }

  async getUserFromCode(code, state) {
    try {
      stateStore.validate(state);

      const { tokens } = await this.client.getToken({ code });
      this.client.setCredentials(tokens);

      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        provider: "google",
        providerId: payload.sub,
        email: payload.email,
        username: payload.name,
        avatar: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch (err) {
      throw new Error(`Google OAuth failed: ${err.message}`);
    }
  }
}

module.exports = new GoogleOAuthProvider();
