const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const env = require("../helpers/env");

class TwoFactorService {
  generateSecret(email) {
    return speakeasy.generateSecret({
      length: 20,
      name: `${env.APP_NAME} (${email})`,
    });
  }

  async generateQRCode(otpauthUrl) {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
  }

  generateBackupCodes() {
    const codes = [];

    for (let i = 0; i < 8; i++) {
      codes.push(crypto.randomBytes(4).toString("hex"));
    }

    return codes;
  }

  hashCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }
}

module.exports = new TwoFactorService();
