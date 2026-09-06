import emailLayout from "../layouts/emailLayout.js";

// 1. BOOKING CREATED
// Customer creates booking → Provider
const bookingCreatedEmail = ({
    providerName,
    customerName,
    serviceTitle,
    bookingDate,
    startTime,
    endTime,
    totalAmount,
    bookingUrl,
}) => {
    return emailLayout({
        title: "New Booking Request",
        previewText: `${customerName} has requested your service`,
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                New Booking Request
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${providerName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                You have received a new booking request from
                <strong>${customerName}</strong>.
                Please review the details below and respond to the request.
            </p>

            ${bookingDetails({
                serviceTitle,
                customerName,
                bookingDate,
                startTime,
                endTime,
                totalAmount,
            })}

            ${button(bookingUrl, "View Booking Request")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Please review the request and respond at your earliest
                convenience.
            </p>
        `,
    });
};

// 2. BOOKING ACCEPTED
// Provider accepts → Customer
const bookingAcceptedEmail = ({
    customerName,
    providerName,
    serviceTitle,
    bookingDate,
    startTime,
    endTime,
    totalAmount,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Booking Confirmed",
        previewText: "Your ServiceHub booking has been confirmed",
        content: `
            <div style="
                margin-bottom: 24px;
                font-size: 40px;
            ">
                🎉
            </div>

            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Your booking is confirmed
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
                Great news! <strong>${providerName}</strong> has accepted
                your booking request.
            </p>

            ${bookingDetails({
                serviceTitle,
                providerName,
                bookingDate,
                startTime,
                endTime,
                totalAmount,
            })}

            ${button(bookingUrl, "View Booking")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Please make sure you're available at the scheduled time.
            </p>
        `,
    });
};

//  3. BOOKING REJECTED
// Provider rejects → Customer
const bookingRejectedEmail = ({
    customerName,
    providerName,
    serviceTitle,
    bookingDate,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Booking Request Update",
        previewText: "There has been an update to your booking request",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Booking request update
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
                Unfortunately, <strong>${providerName}</strong> was unable
                to accept your booking request.
            </p>

            ${bookingDetails({
                serviceTitle,
                providerName,
                bookingDate,
            })}

            ${button(bookingUrl, "Find Another Service")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                We hope you find another service that meets your needs.
            </p>
        `,
    });
};

// 4. BOOKING CANCELLED
// Customer / Provider cancels → Other party
const bookingCancelledEmail = ({
    recipientName,
    cancelledBy,
    serviceTitle,
    bookingDate,
    startTime,
    endTime,
    cancellationReason,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Booking Cancelled",
        previewText: "Your ServiceHub booking has been cancelled",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Booking cancelled
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${recipientName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Your booking for <strong>${serviceTitle}</strong> has been
                cancelled by the ${cancelledBy}.
            </p>

            ${bookingDetails({
                serviceTitle,
                bookingDate,
                startTime,
                endTime,
            })}

            ${
                cancellationReason
                    ? `
                        <div style="
                            margin: 0 0 28px;
                            padding: 16px 18px;
                            background-color: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                        ">
                            <p style="
                                margin: 0 0 6px;
                                font-size: 13px;
                                font-weight: 600;
                                color: #374151;
                            ">
                                Cancellation reason
                            </p>

                            <p style="
                                margin: 0;
                                font-size: 14px;
                                line-height: 22px;
                                color: #6b7280;
                            ">
                                ${cancellationReason}
                            </p>
                        </div>
                    `
                    : ""
            }

            ${button(bookingUrl, "View Booking")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                If you have any questions regarding this cancellation,
                please contact ServiceHub support.
            </p>
        `,
    });
};
// 5. BOOKING REMINDER
// Customer + Provider
const bookingReminderEmail = ({
    recipientName,
    serviceTitle,
    otherPartyName,
    bookingDate,
    startTime,
    endTime,
    bookingUrl,
}) => {
    return emailLayout({
        title: "Upcoming Booking Reminder",
        previewText: "Your ServiceHub booking is coming up soon",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Your booking is coming up
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                Hi ${recipientName},
            </p>

            <p style="
                margin: 0 0 28px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                This is a reminder that you have an upcoming booking
                scheduled soon.
            </p>

            ${bookingDetails({
                serviceTitle,
                otherPartyName,
                bookingDate,
                startTime,
                endTime,
            })}

            ${button(bookingUrl, "View Booking")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Please be ready at the scheduled time.
            </p>
        `,
    });
};

// 6. BOOKING COMPLETED
// Booking completed → Customer
const bookingCompletedEmail = ({
    customerName,
    providerName,
    serviceTitle,
    bookingDate,
    totalAmount,
    bookingUrl,
    reviewUrl,
}) => {
    return emailLayout({
        title: "Booking Completed",
        previewText: "Your ServiceHub booking has been completed",
        content: `
            <div style="
                margin-bottom: 24px;
                font-size: 40px;
            ">
                ✓
            </div>

            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Booking completed
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
                Your booking with <strong>${providerName}</strong> has
                been marked as completed.
            </p>

            ${bookingDetails({
                serviceTitle,
                providerName,
                bookingDate,
                totalAmount,
            })}

            ${button(reviewUrl, "Leave a Review")}

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Your feedback helps other customers make better decisions
                and helps service providers improve.
            </p>

            <p style="
                margin: 12px 0 0;
                font-size: 13px;
                line-height: 20px;
                color: #9ca3af;
            ">
                You can also
                <a
                    href="${bookingUrl}"
                    style="color: #4b5563;"
                >
                    view your booking details
                </a>.
            </p>
        `,
    });
};


// Reusable Booking Details

const bookingDetails = ({
    serviceTitle,
    providerName,
    customerName,
    otherPartyName,
    bookingDate,
    startTime,
    endTime,
    totalAmount,
}) => {
    const participantName =
        providerName || customerName || otherPartyName;

    return `
        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
                margin-bottom: 28px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            "
        >
            <tr>
                <td style="padding: 20px;">

                    <p style="
                        margin: 0 0 16px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #6b7280;
                    ">
                        Booking Details
                    </p>

                    ${
                        serviceTitle
                            ? `
                                <p style="
                                    margin: 0 0 10px;
                                    font-size: 15px;
                                    line-height: 22px;
                                    color: #374151;
                                ">
                                    <strong>Service:</strong>
                                    ${serviceTitle}
                                </p>
                            `
                            : ""
                    }

                    ${
                        participantName
                            ? `
                                <p style="
                                    margin: 0 0 10px;
                                    font-size: 15px;
                                    line-height: 22px;
                                    color: #374151;
                                ">
                                    <strong>
                                        ${
                                            providerName
                                                ? "Provider"
                                                : "Customer"
                                        }:
                                    </strong>
                                    ${participantName}
                                </p>
                            `
                            : ""
                    }

                    ${
                        bookingDate
                            ? `
                                <p style="
                                    margin: 0 0 10px;
                                    font-size: 15px;
                                    line-height: 22px;
                                    color: #374151;
                                ">
                                    <strong>Date:</strong>
                                    ${bookingDate}
                                </p>
                            `
                            : ""
                    }

                    ${
                        startTime && endTime
                            ? `
                                <p style="
                                    margin: 0 0 10px;
                                    font-size: 15px;
                                    line-height: 22px;
                                    color: #374151;
                                ">
                                    <strong>Time:</strong>
                                    ${startTime} – ${endTime}
                                </p>
                            `
                            : ""
                    }

                    ${
                        totalAmount !== undefined
                            ? `
                                <p style="
                                    margin: 0;
                                    font-size: 15px;
                                    line-height: 22px;
                                    color: #374151;
                                ">
                                    <strong>Total Amount:</strong>
                                    ₹${totalAmount}
                                </p>
                            `
                            : ""
                    }

                </td>
            </tr>
        </table>
    `;
};

// Reusable CTA Button

const button = (url, text) => {
    return `
        <a
            href="${url}"
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
            ${text}
        </a>
    `;
};


export {
    bookingCreatedEmail,
    bookingAcceptedEmail,
    bookingRejectedEmail,
    bookingCancelledEmail,
    bookingReminderEmail,
    bookingCompletedEmail,
};