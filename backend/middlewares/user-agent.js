const UAParser = require("ua-parser-js");

function normalizeDevice(parsed) {
  const { browser, os, device, cpu, ua } = parsed;

  let type = device?.type;

  if (!type) {
    const u = ua.toLowerCase();

    if (u.includes("mobi") || u.includes("android")) type = "mobile";
    else if (u.includes("tablet") || u.includes("ipad")) type = "tablet";
    else type = "desktop";
  }

  const nameParts = [browser?.name, os?.name].filter(Boolean);

  const name = nameParts.join(" on ");

  return {
    type,
    name,
    browser: browser?.name,
    os: os?.name,
    cpu: cpu?.architecture,
  };
}
module.exports = function getUserAgent(req, _, next) {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();
  req.userAgent = normalizeDevice(result);
  console.log(req.userAgent);
  next();
};
