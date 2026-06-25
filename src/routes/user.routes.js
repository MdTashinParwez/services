import {Router} from 'express';
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateProfileDetails, updateUserAvatar } from '../controllers/user.controller.js';
import {upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router()

router.route("/register").post(
    upload.fields([{name: "avatar", maxCount: 1}]), registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateProfileDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)


export default router 
