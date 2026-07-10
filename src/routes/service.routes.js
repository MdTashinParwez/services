import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createService,
  updateService,
  deleteService,
  getMyService,
  getAllServices,
  getServiceById,
} from "../controllers/service.controller.js";


const router = Router();

router.route("/")
.post( verifyJWT,upload.fields([
    {
      name: "images",
      maxCount: 5,
    },
  ]),createService
);

router.route("/").get(getAllServices);

router.route("/my-services").get( verifyJWT, getMyService);

router.route("/:id").get(getServiceById);

router.route("/:id").patch(
  verifyJWT, upload.fields([
    {
      name: "images",
      maxCount: 5,
    },
  ]), updateService
);
router.route("/:id").delete(verifyJWT,deleteService);

export default router;