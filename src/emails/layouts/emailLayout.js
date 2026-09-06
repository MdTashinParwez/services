const emailLayout = ({
    title,
    previewText = "",
    content,
}) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${title}</title>

    <meta
        name="x-apple-disable-message-reformatting"
        content="yes"
    />
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
    "
>

    <!-- Preview text -->
    <div
        style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
        "
    >
        ${previewText}
    </div>

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="background-color: #f4f6f8; padding: 40px 16px;"
    >
        <tr>
            <td align="center">

                <!-- Main container -->
                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                    "
                >

                    <!-- Header -->
                    <tr>
                        <td
                            style="
                                padding: 28px 32px;
                                border-bottom: 1px solid #e5e7eb;
                            "
                        >
                            <div
                                style="
                                    font-size: 24px;
                                    font-weight: 700;
                                    color: #111827;
                                "
                            >
                                ServiceHub
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td
                            style="
                                padding: 40px 32px;
                            "
                        >
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td
                            style="
                                padding: 24px 32px;
                                background-color: #f9fafb;
                                border-top: 1px solid #e5e7eb;
                            "
                        >

                            <p
                                style="
                                    margin: 0 0 8px;
                                    font-size: 13px;
                                    line-height: 20px;
                                    color: #6b7280;
                                "
                            >
                                Thank you for choosing ServiceHub.
                            </p>

                            <p
                                style="
                                    margin: 0;
                                    font-size: 12px;
                                    line-height: 18px;
                                    color: #9ca3af;
                                "
                            >
                                © ${new Date().getFullYear()} ServiceHub.
                                All rights reserved.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;
};

export default emailLayout;