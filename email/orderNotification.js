export const orderNotification = (data) => {
    const html = `
<!DOCTYPE html>
<html lang="en-US">
<head>
    <title>ThriftYatra Order Confirmed</title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
        #MessageViewBody a { color: inherit; text-decoration: none; }
        p { line-height: inherit }
        .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
        .image_block img+div { display: none; }
        .row-4 .column-1 .block-3 .button:hover {
            background-color: #d4a520 !important;
            color: #000000 !important;
        }
        @media (max-width:700px) {
            .mobile_hide { display: none; }
            .row-content { width: 100% !important; }
            .stack .column { width: 100%; display: block; }
            .row-2 .row-content { padding: 30px !important; }
            .row-4 .row-content { padding: 0 30px 30px !important; }
            .row-5 .row-content { padding: 20px !important; }
        }
    </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="background-color: #ffffff;" width="100%">
        <tbody>
            <tr>
                <td>
                    <!-- Logo Section -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="background-color: #f7f1ed; border-radius: 0 0 20px 20px; color: #000000; width: 680px; margin: 0 auto;" width="680">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" style="text-align: center; padding: 20px;" width="100%">
                                                    <h2 style="color: #000; font-family: Arial, sans-serif; font-size: 28px; margin: 0;">
                                                        Thrift<span style="color: #E8B931;">Yatra</span>
                                                    </h2>
                                                    <p style="color: #666; font-family: Arial, sans-serif; font-size: 12px; margin: 5px 0 0;">THRIFTED TREASURES • INDIE BRANDS</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Heading -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="color: #000000; padding: 30px 60px 10px; width: 680px; margin: 0 auto;" width="680">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" style="text-align: center;" width="100%">
                                                    <h1 style="color: #000000; font-family: Arial, sans-serif; font-size: 32px; margin: 0;">YOUR ORDER WILL BE SHIPPED SOON!</h1>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Progress Bar -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content" role="presentation" style="color: #000000; width: 680px; margin: 0 auto;" width="680">
                                        <tbody>
                                            <tr>
                                                <td style="text-align: center; padding: 10px 45px; width: 25%;">
                                                    <span style="color: #E8B931; font-size: 24px;">✓</span>
                                                    <p style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; margin: 5px 0 0;">Confirmed</p>
                                                </td>
                                                <td style="width: 25%;"><hr style="border-color: #e1cabf; margin-top: 25px;" /></td>
                                                <td style="text-align: center; padding: 10px; width: 25%;">
                                                    <p style="color: #e1cabf; font-family: Arial, sans-serif; font-size: 16px; margin: 5px 0 0;">Shipped</p>
                                                </td>
                                                <td style="width: 25%;"><hr style="border-color: #e1cabf; margin-top: 25px;" /></td>
                                                <td style="text-align: center; padding: 10px; width: 25%;">
                                                    <p style="color: #e1cabf; font-family: Arial, sans-serif; font-size: 16px; margin: 5px 0 0;">Delivered</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Order ID Section -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="color: #000000; padding-bottom: 40px; padding-left: 60px; padding-right: 60px; width: 680px; margin: 0 auto;" width="680">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" style="text-align: center;" width="100%">
                                                    <div style="font-size: 60px; margin: 20px 0;">📦</div>
                                                    <h3 style="color: #E8B931; font-family: Arial, sans-serif; font-size: 22px; margin: 10px 0;">
                                                        Order ID: ${data.order_id}
                                                    </h3>
                                                    <a href="${data.orderDetailsUrl}" style="background-color: #E8B931; border-radius: 30px; color: #000000; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; padding: 12px 35px; text-decoration: none; margin-top: 15px;" target="_blank">
                                                        VIEW MY ORDER
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Footer -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="background-color: #000000; border-radius: 20px 20px 0 0; color: #000000; padding: 20px 60px; width: 680px; margin: 0 auto;" width="680">
                                        <tbody>
                                            <tr>
                                                <td style="text-align: left; width: 60%;">
                                                    <p style="color: #f7f1ed; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; margin: 0;">THRIFTED TREASURES • INDIE BRANDS</p>
                                                </td>
                                                <td style="text-align: right; width: 40%;">
                                                    <a href="https://instagram.com/thriftyatra" target="_blank" style="margin: 0 4px;">
                                                        <img src="https://res.cloudinary.com/dg7efdu9o/image/upload/v1747200655/instagram2x_fbwltb.webp" width="32" alt="Instagram" style="border: 0;" />
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Bottom Bar -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content" role="presentation" style="background-color: #000000; width: 680px; margin: 0 auto; padding: 10px 60px 20px;" width="680">
                                        <tbody>
                                            <tr>
                                                <td style="text-align: center; padding: 15px 0;">
                                                    <p style="color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; margin: 0;">
                                                        <strong>Have a question?</strong> Contact us on Instagram <a href="https://instagram.com/thriftyatra" style="color: #E8B931; text-decoration: underline;">@thriftyatra</a>
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: center; padding: 15px 0;">
                                                    <hr style="border-color: #3a3a3a; width: 100%;" />
                                                    <p style="color: #888; font-family: Arial, sans-serif; font-size: 12px; margin: 10px 0 0;">
                                                        © 2025 ThriftYatra™. All Rights Reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`;

    return html;
};