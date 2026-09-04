import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
app.use(cors({
origin: process.env.CORS_ORIGIN,
credentials: true
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());








// Routes
import userRouter from "./routes/user.routes.js";
import providerRouter from "./routes/provider.routes.js"
import serviceRouter from "./routes/service.routes.js"
import bookingRouter from "./routes/booking.routes.js"
import paymentRouter from "./routes/payment.routes.js"
import categoryRouter from "./routes/category.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import healthRouter from "./routes/health.routes.js"; // redis health

import testRouter from "./routes/test.routes.js"; // test routes





// define routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/providers",providerRouter);
app.use("/api/v1/services",serviceRouter);
app.use("/api/v1/booking",bookingRouter);
app.use("/api/v1/payment",paymentRouter)
app.use("/api/v1/categories",categoryRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/health", healthRouter); // redis health 
app.use("/test", testRouter);




// error handling 
app.use(errorHandler);

export{app} 


// check git restoring