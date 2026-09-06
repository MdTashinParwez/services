import emailLayout from "../layouts/emailLayout.js";

const paymentSuccessEmail = ({
    customerName,
    serviceTitle,
    amount,
    paymentId,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Payment Confirmed",
        previewText: "Your ServiceHub payment was successful",
        content: `
            <div style="font-size: 40px; margin-bottom: 24px;">✓</div>

            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Payment confirmed
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${customerName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Your payment has been successfully received and your
                transaction has been recorded.
            </p>

            <div style="
                margin-bottom: 28px;
                padding: 20px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">
                <p style="
                    margin: 0 0 10px;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Service:</strong> ${serviceTitle}
                </p>

                <p style="
                    margin: 0 0 10px;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Amount Paid:</strong> ₹${amount}
                </p>

                <p style="
                    margin: 0;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Payment ID:</strong> ${paymentId}
                </p>
            </div>

            <a
                href="${bookingUrl}"
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
                View Booking
            </a>
        `,
    });
};


const paymentFailedEmail = ({
    customerName,
    serviceTitle,
    amount,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Payment Failed",
        previewText: "We were unable to process your ServiceHub payment",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Payment could not be completed
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${customerName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                We were unable to process the payment for your booking.
                Your payment has not been marked as successful.
            </p>

            <div style="
                margin-bottom: 28px;
                padding: 20px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">
                <p style="
                    margin: 0 0 10px;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Service:</strong> ${serviceTitle}
                </p>

                <p style="
                    margin: 0;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Amount:</strong> ₹${amount}
                </p>
            </div>

            <a
                href="${bookingUrl}"
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
                Try Payment Again
            </a>

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                If the amount was deducted from your account despite this
                message, please contact our support team.
            </p>
        `,
    });
};




const refundCompletedEmail = ({
    customerName,
    serviceTitle,
    refundAmount,
    paymentId,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Refund Completed",
        previewText: "Your ServiceHub refund has been processed",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Refund completed
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${customerName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Your refund for <strong>${serviceTitle}</strong> has been
                successfully processed.
            </p>

            <div style="
                margin-bottom: 28px;
                padding: 20px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">
                <p style="
                    margin: 0 0 10px;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Refund Amount:</strong> ₹${refundAmount}
                </p>

                <p style="
                    margin: 0;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Payment ID:</strong> ${paymentId}
                </p>
            </div>

            <a
                href="${bookingUrl}"
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
                View Booking
            </a>

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                The time it takes for the refunded amount to appear in your
                account may depend on your payment provider.
            </p>
        `,
    });
};


export {
    paymentSuccessEmail,
    paymentFailedEmail,
    refundCompletedEmail,
};