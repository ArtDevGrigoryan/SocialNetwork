const {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const path = require("path");
const env = require("@helpers/env");

const s3 = new S3Client({
  endpoint: env.STROJ_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: env.STORJ_ACCESS_KEY,
    secretAccessKey: env.STORJ_SECRET_KEY,
  },
});

class MediaService {
  async upload(files, folder = "misc") {
    if (!files) throw new Error("File(s) is required");

    const fileList = Array.isArray(files) ? files : [files];

    const uploads = await Promise.all(
      fileList.map(async (file) => {
        this.#validate(file);

        const ext = path.extname(file.originalname) || "";
        const key = `${folder}/${uuid()}${ext}`;

        const command = new PutObjectCommand({
          Bucket: env.STROJ_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await s3.send(command);

        return {
          key,
          url: this.#getUrl(key),
        };
      }),
    );

    return uploads;
  }

  async delete(keys) {
    if (!keys || !keys.length) throw new Error("Key is required");

    await Promise.all(
      keys.map(async (key) => {
        const command = new DeleteObjectCommand({
          Bucket: env.STROJ_BUCKET_NAME,
          Key: key,
        });

        await s3.send(command);
      }),
    );
    return true;
  }

  #getUrl(key) {
    return `https://${env.STROJ_BUCKET_NAME}.${env.STROJ_ENDPOINT}/${key}`;
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
}

module.exports = new MediaService();
