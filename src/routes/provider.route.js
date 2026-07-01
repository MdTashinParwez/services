import { getcurrentProvider,
     getProviderById, 
     providerUser,
      updateProviderDetail,
       updateProviderDocument } from "../controllers/provider.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import {Router} from 'express';

const router = Router()

router.route("/").post(
    upload.fields([{name: "documents", maxCount:1}]),verifyJWT,providerUser)
router.route("/profile").patch(verifyJWT,updateProviderDetail)
router.route("/documents").patch(verifyJWT,upload.single("documents"),updateProviderDocument)
router.route("/me").get(verifyJWT,getcurrentProvider)
router.route("/:id").get(verifyJWT,getProviderById)

export default router