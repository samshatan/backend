import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccesAndRefreshTokens = async(UserId) => {
  try{
    const user = await User.findById(UserId)
    console.log(user);
    const accessToken = user.generateAcessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch(error){
    throw new ApiError(500, "Somethign Went while generating refresh and acces token")
  }
}

const registerUser = asyncHandler( async (req, res) =>{
  // get user deatils from frontend

  const {fullName, email, username, password} = req.body;
  console.log("Request body", req.body);
  console.log("FUllName: ", fullName,email,username,password);


  // validation - not empty

  // if (fullName===""){
  //   throw new ApiError(400, "Full Name is Required");
  // }
  if (
    [fullName, email, username, password].some((field)=> field?.trim() === "")
  ){
    throw new ApiError(400, "All Fields are Required");
  }

  // check if user already exists: username and email

 const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  console.log("Existed user", existedUser);

  if(existedUser){
    throw new ApiError(409, "User with email or username already exist");
  }

  let avatarLocalPath;
  if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    avatarLocalPath = req.files.avatar[0].path;
  }
  console.log("Request files",req.files);

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // check for images, check for avatar

  if(!avatarLocalPath){
    throw new ApiError(400, "Avater Needed");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);


  // upload them to cloudinary, avatar check

  if(!avatar){
    throw new ApiError(400, "Avater file is required");
  }  

  // create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

    // remove password and refresh token field from response

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // check response for user creation

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registring the user")
  }

  // return response if created else error

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Created Succesfully")
  )

})

const loginUser = asyncHandler(async (req,res) => {
  // request body se data 

  const {username, email, password} = req.body;
  console.log(email);

  if(!username && !email){
    throw new ApiError(400, "Username and password is required")
  }
  // username or email 
  // find the user

  const userfind = await User.findOne({
    $or: [{username},{email}]
  })

  if(!userfind){
    throw new ApiError(404, "User does not exist");
  }

  // password check

  const isPasswordValid = await userfind.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401, "Password incorrect");
  }

  // access and refresh token generation

  const {accessToken, refreshToken} = await generateAccesAndRefreshTokens(userfind._id);

  // send cookie

  const loggedInUser = await User.findById(userfind._id).
  select("-password -refreshToken");
  
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User Logged In Succesfully"
    )
  )

})

const logoutUser = asyncHandler(async (req,res) =>{
  // remove cookie and accesToken and refreshToken
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))
  
})

const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }
  console.log(incomingRefreshToken);

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
    console.log("user finded"+user)
  
    if(!user){
      throw new ApiError(401, "Invalid Refresh Token");
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh Token is Expired or Used");
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newrefreshToken} = await generateAccesAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken, refreshToken: newrefreshToken
        },
        "Acces Token Refreshed Succesfully"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid Old Password")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password Change Succesfully"));
  
})

const getCurrentUser = asyncHandler(async(req,res)=> {
  return res.status(200).json(new ApiResponse(200, req.user, "Current User fetched Succesfully"))
})

const updateUserDetails = asyncHandler(async(req,res)=>{
  const {fullName, email} = req.body;
  if(!fullName || !email){
    throw new ApiError(400, "Edit Both fullName and email Detail");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Accoutn details Succesfully"))
})

const userAvatarUpdate = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user,"Avatar image updated succesfully")
  )
})

const userCoverImageUpdate = asyncHandler(async(req,res)=>{
  const coverLocalPath = req.file?.path

  if(!coverLocalPath){
    throw new ApiError(400, "Cover file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading on cover");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, user,"Cover image updated succesfully")
  )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400, "User name is missing and not defined");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount: {
          $size: "$subscribers"
        },
        subscribedToChannel: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        subscribedToChannel: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  console.log(channel);

  if(!channel?.length){
    throw new ApiError(400, "Channel does not exist ");
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User Channel Fetched Succesfully"))

})

const getWatchHistory = asyncHandler(async(req,res) => {
  // req.user._id // get string mongoose behind the scene
  const user =await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "Video",
        localField: "WatchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Succesfully")
  )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateUserDetails, userAvatarUpdate, userCoverImageUpdate, getUserChannelProfile, getWatchHistory}