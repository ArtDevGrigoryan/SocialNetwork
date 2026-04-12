const axios = require("axios");
const stateStore = require("@lib/oauth-state.store");
const env = require("@helpers/env");

class GithubOAuthProvider {
  constructor() {
    this.clientId = env.GITHUB_CLIENT_ID;
    this.clientSecret = env.GITHUB_CLIENT_SECRET;
    this.redirectUri = env.GITHUB_OAUTH_REDIRECT_URL;
  }

  getAuthUrl() {
    const state = stateStore.generate();

    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=user:email` +
      `&state=${state}`;

    return { url, state };
  }

  async getUserFromCode(code, state) {
    try {
      stateStore.validate(state);

      const tokenRes = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
          state,
        },
        { headers: { Accept: "application/json" } },
      );

      const accessToken = tokenRes.data.access_token;
      if (!accessToken) {
        throw new Error("GitHub access token not received");
      }

      const [userRes, emailsRes] = await Promise.all([
        axios.get("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const user = userRes.data;
      const primaryEmail = emailsRes.data.find((e) => e.primary && e.verified);

      return {
        provider: "github",
        providerId: user.id,
        email: primaryEmail?.email || null,
        username: user.login,
        avatar: user.avatar_url,
      };
    } catch (err) {
      throw new Error(`GitHub OAuth failed: ${err.message}`);
    }
  }
}

module.exports = new GithubOAuthProvider();
