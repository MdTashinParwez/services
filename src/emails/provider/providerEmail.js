import emailLayout from "../layouts/emailLayout.js";

const providerApplicationEmail = ({
    providerName,
    businessName,
}) => {
    return emailLayout({
        title: "Provider Application Received",
        previewText: "We've received your ServiceHub provider application",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Application received
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
                We've received your application to become a ServiceHub
                service provider.
            </p>

            <div style="
                margin-bottom: 28px;
                padding: 20px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">
                <p style="
                    margin: 0;
                    font-size: 15px;
                    color: #374151;
                ">
                    <strong>Business Name:</strong> ${businessName}
                </p>
            </div>

            <p style="
                margin: 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Our team will review your application and notify you once
                a decision has been made.
            </p>
        `,
    });
};

const providerApprovedEmail = ({
    providerName,
    businessName,
    dashboardUrl,
}) => {
    return emailLayout({
        title: "Your Provider Account Has Been Approved",
        previewText: "Congratulations! Your ServiceHub provider account is approved",
        content: `
            <div style="font-size: 40px; margin-bottom: 24px;">🎉</div>

            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                You're approved!
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
                Your ServiceHub provider account for
                <strong>${businessName}</strong> has been approved.
                You can now start offering your services to customers.
            </p>

            <a
                href="${dashboardUrl}"
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
                Open Provider Dashboard
            </a>

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Complete your profile, add your services, and start
                building your presence on ServiceHub.
            </p>
        `,
    });
};

const providerRejectedEmail = ({
    providerName,
    businessName,
    reason,
    dashboardUrl,
}) => {
    return emailLayout({
        title: "Provider Application Update",
        previewText: "There has been an update to your ServiceHub provider application",
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Application update
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
                margin: 0 0 20px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                We've reviewed your provider application for
                <strong>${businessName}</strong>.
            </p>

            <p style="
                margin: 0 0 20px;
                font-size: 16px;
                line-height: 26px;
                color: #4b5563;
            ">
                At this time, we're unable to approve your application.
            </p>

            ${
                reason
                    ? `
                        <div style="
                            margin-bottom: 28px;
                            padding: 18px;
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
                                Reason
                            </p>

                            <p style="
                                margin: 0;
                                font-size: 14px;
                                line-height: 22px;
                                color: #6b7280;
                            ">
                                ${reason}
                            </p>
                        </div>
                    `
                    : ""
            }

            <a
                href="${dashboardUrl}"
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
                Review Application
            </a>

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                If you believe this decision was made in error, please
                contact ServiceHub support.
            </p>
        `,
    });
};


const serviceApprovedEmail = ({
    providerName,
    serviceTitle,
    serviceUrl,
}) => {
    return emailLayout({
        title: "Service Approved",
        previewText: "Your ServiceHub service has been approved",
        content: `
            <div style="font-size: 40px; margin-bottom: 24px;">🎉</div>

            <h1 style="
                margin: 0 0 16px;
                font-size: 28px;
                line-height: 36px;
                color: #111827;
            ">
                Service approved
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
                Your service <strong>${serviceTitle}</strong> has been
                approved and is now available to customers.
            </p>

            <a
                href="${serviceUrl}"
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
                View Service
            </a>

            <p style="
                margin: 28px 0 0;
                font-size: 14px;
                line-height: 22px;
                color: #6b7280;
            ">
                Keep your service information accurate and up to date to
                provide customers with the best possible experience.
            </p>
        `,
    });
};


export {
    providerApplicationEmail,
    providerApprovedEmail,
    providerRejectedEmail,
    serviceApprovedEmail,
};