import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


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







// define routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/providers",providerRouter);
app.use("/api/v1/services",serviceRouter);
app.use("/api/v1/booking",bookingRouter);
app.use("/api/v1/payment",paymentRouter)











export{app} 


// check git restoring