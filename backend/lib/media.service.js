const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const env = require("@helpers/env");

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_ACCESS_KEY,
  api_secret: env.CLOUDINARY_SECRET_KEY,
});

class MediaService {
  async upload(files, folder = "misc") {
    if (!files) throw new Error("File(s) is required");

    const fileList = Array.isArray(files) ? files : [files];

    const uploads = await Promise.all(
      fileList.map(async (file) => {
        this.#validate(file);

        const streamUpload = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: this.#getResourceType(file.mimetype),
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              },
            );

            Readable.from(buffer).pipe(stream);
          });
        };

        const result = await streamUpload(file.buffer);

        return {
          key: result.public_id,
          url: result.secure_url,
        };
      }),
    );

    return uploads;
  }

  async delete(keys) {
    if (!keys || !keys.length) return;

    await Promise.all(
      keys.map(async (key) => {
        await cloudinary.uploader.destroy(key, {});
      }),
    );

    return true;
  }

  #validate(file) {
    const allowed = ["image/", "video/", "audio/"];

    const isValid = allowed.some((type) => file.mimetype.startsWith(type));

    if (!isValid) {
      throw new Error("Invalid file type");
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File too large");
    }
  }

  #getResourceType(mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "raw";
    return "auto";
  }
}

module.exports = new MediaService();
