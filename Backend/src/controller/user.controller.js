import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) =>{
  // get user deatils from frontend

  const {fullName, email, username, password} = req.body;
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

 const existedUser = User.findOne({
    $or: [{ username }, { email }]
  })
  console.log("Existed user", existedUser);

  if(existedUser){
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  console.log(req.files);
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  
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

export {registerUser};