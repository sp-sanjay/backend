import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  destroyFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { COOKIE_OPTIONS } from "../constants/config.constant.js";
import mongoose from "mongoose";
import { DEFAULT_LIMIT, DEFAULT_SKIP } from "../constants.js";
const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and accessToken"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (
    [fullName, username, email, password].some(
      (field) => field && field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  const avatarLocalPath =
    req.files && req.files?.avatar?.length > 0 && req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const cloudinaryAvatar = await uploadOnCloudinary(avatarLocalPath);
  let cloudinaryCoverImage;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    const coverImageLocalPath = await req.files.coverImage[0]?.path;
    cloudinaryCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const avatar = {
    url: cloudinaryAvatar.url,
    publicId: cloudinaryAvatar.public_id,
  };
  const coverImage = {
    url: cloudinaryCoverImage?.url || "",
    publicId: cloudinaryCoverImage?.public_id || "",
  };
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar,
    coverImage,
  });

  const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
    user._id
  );
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //select method for removing fields from the response
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Creating User");
  }

  const cookies = {
    accessToken,
    refreshToken,
  };

  ApiResponse(
    res,
    { user: createdUser, accessToken },
    "User registered successfully!!",
    201,
    cookies
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User does not found");
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError(400, "Invalid Credentials");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging");
  }

  const cookies = {
    accessToken,
    refreshToken,
  };
  ApiResponse(
    res,
    { user: loggedInUser, accessToken },
    "User logged in successfully!!",
    200,
    cookies
  );
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      }, //remove refreshToken from DB use $unset operator
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json({
      statusCode: 200,
      data: {},
      message: "User Logged out",
      success: true,
    });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingToken) {
      throw new ApiError(400, "RefreshToken is Required");
    }
    const decodedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid RefreshToken");
    }

    if (incomingToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid RefreshToken");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
      user._id
    );

    const cookies = {
      accessToken,
      refreshToken,
    };
    ApiResponse(res, cookies, "AccessToken refreshed", 200, cookies);
  } catch (error) {
    throw new ApiError(401, "Invalid RefreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  if (newPassword && confirmNewPassword) {
    if (!(newPassword === confirmNewPassword)) {
      throw new ApiError(400, "NewPassword and confirmPassword is not matched");
    }
  }

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Password is Incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  ApiResponse(res, {}, "Password change successfully");
});

const getCurrentUser = asyncHandler(async (req, res) => {
  ApiResponse(res, req.user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All Fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        fullName,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  ApiResponse(res, user, "User Profile updated successfully");
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: {
          url: avatar.url,
          publicId: avatar.public_id,
        },
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  if (req.user?.avatar?.publicId) {
    await destroyFromCloudinary(req.user.avatar.publicId);
  }
  ApiResponse(res, user, "Avatar updated successfully");
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: {
          url: coverImage.url,
          publicId: coverImage.public_id,
        },
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  if (req.user?.coverImage?.publicId) {
    await destroyFromCloudinary(req.user.coverImage.publicId);
  }
  ApiResponse(res, user, "coverImage updated successfully");
});

const getUserProfileChannelAndSubscriber = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;
    if (!username?.trim()) {
      throw new ApiError(400, "username is required");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $eq: [{ $in: [req.user?._id, "$subscribers.subscriber"] }, true],
          },
        },
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          email: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          avatar: 1,
          coverImage: 1,
          isSubscribed: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "username doesn't exist");
    }

    ApiResponse(res, channel[0], "channelData fetch successfully");
  } catch (error) {
    throw new ApiError(error.statusCode, error.message, error);
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  let { skip, limit } = req.params;
  skip = skip ?? DEFAULT_SKIP;
  limit = limit ?? DEFAULT_LIMIT;

  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
      {
        $facet: {
          data: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          count: [
            {
              $count: "count",
            },
          ],
        },
      },
    ]);
    const { data, count } = user.length > 0 ? user[0] : { data: [], count: 0 };
    ApiResponse(res, data);
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something Went Wrong"
    );
  }
});

export {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserProfile,
  updateAvatar,
  updateCoverImage,
  getUserProfileChannelAndSubscriber,
  getWatchHistory,
};
