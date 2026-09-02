import {Router} from 'express';
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateProfileDetails, updateUserAvatar } from '../controllers/user.controller.js';
import {upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateRegisterUser,validateLoginUser,validateChangePassword,validateUpdateProfile,} from "../validators/user.validator.js";
import { validate } from "../middlewares/validation.middleware.js";
import rateLimiter from "../middlewares/rateLimiter.middleware.js";
import { RATE_LIMITS } from "../config/rateLimit.config.js";


const router = Router()

router.route("/register").post( rateLimiter(RATE_LIMITS.register),
    upload.fields([{name: "avatar", maxCount: 1}]),validate(validateRegisterUser), registerUser)

router.route("/login").post( rateLimiter(RATE_LIMITS.login), validate(validateLoginUser),loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, rateLimiter(RATE_LIMITS.changePassword),validate(validateChangePassword),changeCurrentPassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,  validate(validateUpdateProfile),updateProfileDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)


export default router 
