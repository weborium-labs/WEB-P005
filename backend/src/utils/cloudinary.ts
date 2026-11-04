import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an in-memory file buffer directly to Cloudinary using streams
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = "portfolio_glimpses",
  publicId?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: publicId, // Guarantees Cloudinary saves each file separately
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary using public_id
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  return await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;