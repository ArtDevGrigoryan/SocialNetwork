const TwoFa = require("@models/two-factor");

async function createTwoFa(doc) {
  const existingTwoFa = await TwoFa.findOne({ user: doc._id });
  if (!existingTwoFa) {
    const twoFa = await TwoFa.create({
      user: doc._id,
    });
    return twoFa._id;
  }
  return null;
}

module.exports = createTwoFa;
