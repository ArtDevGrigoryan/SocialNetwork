const { connect, disconnect } = require("./db");
const env = require("./env");
const User = require("../models/user");
const Setting = require("../models/setting");
const TwoFa = require("../models/two-factor");
const UserConfig = require("../models/user-config");
const { default: axios } = require("axios");
const fs = require("fs/promises");

console.log("TEST auth/register");

(async () => {
  try {
    await connect();
    const { data } = await axios.post(
      "http://localhost:8888/api/auth/register",
      {
        name: "Test-user",
        email: "testuser@gmail.com",
        password: "Testuser$123",
      },
    );
    console.log(data);
    const user = data.payload.user._id;
    await fs.appendFile("./data.json", JSON.stringify({ User: user._id }));
    await Promise.all([
      User.deleteOne({ _id: user }),
      Setting.deleteOne({ user }),
      TwoFa.deleteOne({ user }),
      UserConfig.deleteOne({ user }),
    ]);
  } catch (err) {
    console.log("TEST ERROR", err);
  } finally {
    await disconnect();
  }
})();
