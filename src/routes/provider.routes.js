import { getAllProviders, getcurrentProvider,getProviderById,getProviderStatus,providerUser,updateProviderDetail,
updateProviderDocument } from "../controllers/provider.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import { validate } from "../middlewares/validation.middleware.js";

import {validateCreateProvider,validateUpdateProviderDetail} from "../validators/Provider.validators.js";
import {Router} from 'express';

const router = Router()

router.route("/").post(
    upload.fields([{name: "documents", maxCount:1}]),verifyJWT,validate(validateCreateProvider),providerUser)
router.route("/profile").patch(verifyJWT, validate(validateUpdateProviderDetail),updateProviderDetail)
router.route("/documents").patch(verifyJWT,upload.single("documents"),updateProviderDocument)
router.route("/me").get(verifyJWT,getcurrentProvider)
router.route("/all").get(verifyJWT,getAllProviders)
router.get("/status", verifyJWT, getProviderStatus);
router.route("/:id").get(verifyJWT,getProviderById)
export default router