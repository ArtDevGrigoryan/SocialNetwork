const createTwoFa = require("@mongoose-middleware/create-two-fa");
const createUserConfig = require("@mongoose-middleware/create-user-config");

module.exports = async function postInsertUser(doc, next) {
  try {
    const twoFa = await createTwoFa(doc);
    const userConfig = await createUserConfig(doc);
    const update = {};
    if (twoFa) update.twoFa = twoFa;
    if (userConfig) update.userConfig = userConfig;

    if (Object.keys(update).length) {
      await doc.updateOne({ $set: update });
    }
    next();
  } catch (err) {
    next(err);
  }
};
