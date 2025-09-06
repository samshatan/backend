import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";


const generateAccesAndRefreshTokens = async(UserId) => {
  try{
    const user = await User.findById(UserId)
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

  const avatarLocalPath = req.files?.avatar[0]?.path
  console.log("Request files",req.files);
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
      $set: {
        refreshToken: undefined
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

export {registerUser, loginUser,logoutUser};