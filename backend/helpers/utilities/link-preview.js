const axios = require("axios");

async function fetchLinkPreview(text) {
  const linkRegex = /(https:\/\/[^\s]+)/g;
  const matches = text?.match(linkRegex);
  if (!matches) return null;

  const url = matches[0];

  try {
    const { data } = await axios.get(url, {
      timeout: 4000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const getMetaTag = (html, property) => {
      const match = html.match(
        new RegExp(
          `<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`,
          "i",
        ),
      );
      return match ? match[1] : null;
    };

    const title =
      getMetaTag(data, "og:title") ||
      getMetaTag(data, "twitter:title") ||
      data.match(/<title>([^<]*)<\/title>/i)?.[1];
    const description =
      getMetaTag(data, "og:description") ||
      getMetaTag(data, "twitter:description") ||
      getMetaTag(data, "description");
    const image =
      getMetaTag(data, "og:image") || getMetaTag(data, "twitter:image");

    if (title || description || image) {
      return { url, title, description, image };
    }
  } catch (error) {
    return null;
  }
  return null;
}

module.exports = fetchLinkPreview;
