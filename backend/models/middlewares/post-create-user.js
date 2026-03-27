const createTwoFa = require("@mongoose-middleware/create-two-fa");
const createUserConfig = require("@mongoose-middleware/create-user-config");

module.exports = async function postInsertUser(doc, next) {
  try {
    const twoFa = await createTwoFa(doc);
    const userConfig = await createUserConfig(doc);
    if (twoFa && userConfig) {
      await doc.updateOne({
        $set: {
          twoFa,
          userConfig,
        },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
