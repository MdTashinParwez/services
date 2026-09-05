import resend from "./resend.js";

const sendEmail = async ({
    to,
    subject,
    html,
}) => {

    const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject,
        html,
    });

    if (error) {
        console.error("Email sending failed:", error);
        throw new Error(error.message);
    }

    console.log("Email sent successfully:", data);

    return data;
};

export default sendEmail;