import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    if([fullName, username, email, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All Fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    const avatarLocalPath = await req.files.avatar[0]?.path;
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = await req.files.coverImage[0]?.path
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "" 
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken"); //select method for removing fields from the response
    if(!createdUser) {
        throw new ApiError(500, "Something Went Wrong While Creating User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!!")
    )
})

export { registerUser }