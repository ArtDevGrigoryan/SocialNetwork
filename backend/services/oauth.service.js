const githubService = require("./github.service");
const googleService = require("./google.service");

class OAuthService {
  constructor() {
    this.providers = {
      github: githubService,
      google: googleService,
    };
  }

  getProvider(name) {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`OAuth provider ${name} not registered`);
    }
    return provider;
  }

  getAuthUrl(provider) {
    return this.getProvider(provider).getAuthUrl();
  }

  async getUserFromCode(provider, code, state) {
    return this.getProvider(provider).getUserFromCode(code, state);
  }
}

module.exports = new OAuthService();
