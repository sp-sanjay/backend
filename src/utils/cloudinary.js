import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath); //remove local files from the system
    return res;
  } catch {
    fs.unlinkSync(localFilePath); //remove local files from the system
    return null;
  }
};

const destroyFromCloudinary = async (publicId) => {
  try {
    if(!publicId) {
      throw new Error("please provide publicId")
    }
    await cloudinary.uploader.destroy(publicId);
    return;
  } catch (error) {
    throw new Error(error)
  }
}

export { uploadOnCloudinary, destroyFromCloudinary };
