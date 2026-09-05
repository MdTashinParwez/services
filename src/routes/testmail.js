// import sendEmail from "../utils/sendEmail.js";

// router.get("/email-test", async (req, res) => {

//     await sendEmail({
//         to: "secondaryt25@gmail.com",
//         subject: "ServiceHub Email Test",
//         html: "<h1>Hello Sher 👋</h1><p>Resend is working!</p>",
//     });

//     return res.status(200).json({
//         success: true,
//         message: "Test email sent successfully",
//     });
// });

import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

router.get("/email-test", async (req, res) => {
    try {
        await sendEmail({
            to: "secondaryt25@gmail.com",
            subject: "ServiceHub Email Test",
            html: "<h1>Hello Sher 👋</h1><p>Resend is working!</p>",
        });

        return res.status(200).json({
            success: true,
            message: "Test email sent successfully",
        });
    } catch (error) {
        console.error("Email test failed:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send test email",
            error: error.message,
        });
    }
});

export default router;