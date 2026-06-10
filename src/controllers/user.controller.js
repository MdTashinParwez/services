import asyncHandler from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async (req,res)=>{
    // logic to register user
    // validate input
    // check if user already exists
    // avtar and images handling 
    // save user to database
    // return success response
   
    const {username,email,password} = req.body;
  
   
})

export {registerUser}
