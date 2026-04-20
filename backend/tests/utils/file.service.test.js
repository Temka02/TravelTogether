const {
  uploadFile,
  getFileUrl,
  deleteFile,
} = require("../../src/utils/file.service");
const { s3Client } = require("../../src/config/s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

jest.mock("../../src/config/s3", () => ({
  s3Client: { send: jest.fn() },
  BUCKET_NAME: "test-bucket",
}));
jest.mock("@aws-sdk/s3-request-presigner");

describe("File Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upload file", async () => {
    s3Client.send.mockResolvedValue({});
    const fileKey = await uploadFile(
      Buffer.from("data"),
      "image/jpeg",
      "avatars",
    );
    expect(fileKey).toMatch(/avatars\/[a-f0-9-]+-\d+/);
    expect(s3Client.send).toHaveBeenCalled();
  });

  it("should get signed url", async () => {
    getSignedUrl.mockResolvedValue("https://signed.url");
    const url = await getFileUrl("avatars/test.jpg");
    expect(url).toBe("https://signed.url");
  });

  it("should return null if no fileKey", async () => {
    const url = await getFileUrl(null);
    expect(url).toBeNull();
  });

  it("should delete file", async () => {
    s3Client.send.mockResolvedValue({});
    await deleteFile("avatars/test.jpg");
    expect(s3Client.send).toHaveBeenCalled();
  });
});
