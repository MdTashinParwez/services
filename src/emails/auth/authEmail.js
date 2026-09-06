import emailLayout from "../layouts/emailLayout.js";

const welcomeEmail = ({ username }) => {
    return emailLayout({
        title: "Welcome to ServiceHub",
        previewText: "Your ServiceHub account is ready",
        content: `
            <h1
                style="
                    margin: 0 0 16px;
                    font-size: 28px;
                    line-height: 36px;
                    color: #111827;
                "
            >
                Welcome to ServiceHub, ${username}! 👋
            </h1>

            <p
                style="
                    margin: 0 0 16px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                We're glad to have you with us.
            </p>

            <p
                style="
                    margin: 0 0 28px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Your ServiceHub account is ready. You can now discover
                trusted local professionals, book services, and manage
                your bookings—all from one place.
            </p>

            <a
                href="http://localhost:5173"
                style="
                    display: inline-block;
                    padding: 13px 22px;
                    background-color: #111827;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                "
            >
                Explore ServiceHub
            </a>

            <p
                style="
                    margin: 28px 0 0;
                    font-size: 14px;
                    line-height: 22px;
                    color: #6b7280;
                "
            >
                If you have any questions, our support team is here to help.
            </p>
        `,
    });
};


const verifyEmail = ({ username, verificationUrl }) => {
    return emailLayout({
        title: "Verify your email",
        previewText: "Verify your email address to secure your ServiceHub account",
        content: `
            <h1
                style="
                    margin: 0 0 16px;
                    font-size: 28px;
                    line-height: 36px;
                    color: #111827;
                "
            >
                Verify your email address
            </h1>

            <p
                style="
                    margin: 0 0 16px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Hi ${username},
            </p>

            <p
                style="
                    margin: 0 0 28px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Please verify your email address to complete your
                ServiceHub account setup.
            </p>

            <a
                href="${verificationUrl}"
                style="
                    display: inline-block;
                    padding: 13px 22px;
                    background-color: #111827;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                "
            >
                Verify Email
            </a>

            <p
                style="
                    margin: 28px 0 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #9ca3af;
                "
            >
                If you didn't create a ServiceHub account, you can safely
                ignore this email.
            </p>
        `,
    });
};


const forgotPasswordEmail = ({ username, resetUrl }) => {
    return emailLayout({
        title: "Reset your ServiceHub password",
        previewText: "Reset your ServiceHub password",
        content: `
            <h1
                style="
                    margin: 0 0 16px;
                    font-size: 28px;
                    line-height: 36px;
                    color: #111827;
                "
            >
                Reset your password
            </h1>

            <p
                style="
                    margin: 0 0 16px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Hi ${username},
            </p>

            <p
                style="
                    margin: 0 0 28px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                We received a request to reset the password for your
                ServiceHub account.
            </p>

            <a
                href="${resetUrl}"
                style="
                    display: inline-block;
                    padding: 13px 22px;
                    background-color: #111827;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                "
            >
                Reset Password
            </a>

            <p
                style="
                    margin: 28px 0 0;
                    font-size: 14px;
                    line-height: 22px;
                    color: #6b7280;
                "
            >
                If you didn't request a password reset, no action is
                required. Your password will remain unchanged.
            </p>

            <p
                style="
                    margin: 12px 0 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #9ca3af;
                "
            >
                For your security, never share your password or reset link
                with anyone.
            </p>
        `,
    });
};


const passwordChangedEmail = ({ username }) => {
    return emailLayout({
        title: "Your password was changed",
        previewText: "Your ServiceHub password was successfully changed",
        content: `
            <h1
                style="
                    margin: 0 0 16px;
                    font-size: 28px;
                    line-height: 36px;
                    color: #111827;
                "
            >
                Your password was changed
            </h1>

            <p
                style="
                    margin: 0 0 16px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Hi ${username},
            </p>

            <p
                style="
                    margin: 0 0 20px;
                    font-size: 16px;
                    line-height: 26px;
                    color: #4b5563;
                "
            >
                Your ServiceHub account password was successfully changed.
            </p>

            <div
                style="
                    margin: 0 0 28px;
                    padding: 16px 18px;
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                "
            >
                <p
                    style="
                        margin: 0;
                        font-size: 14px;
                        line-height: 22px;
                        color: #4b5563;
                    "
                >
                    If you made this change, no further action is required.
                </p>
            </div>

            <p
                style="
                    margin: 0;
                    font-size: 14px;
                    line-height: 22px;
                    color: #6b7280;
                "
            >
                If you did not change your password, please secure your
                account immediately.
            </p>

            <p
                style="
                    margin: 16px 0 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #9ca3af;
                "
            >
                ServiceHub Security Team
            </p>
        `,
    });
};


export {
    welcomeEmail,
    verifyEmail,
    forgotPasswordEmail,
    passwordChangedEmail,
};