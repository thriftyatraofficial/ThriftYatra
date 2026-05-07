export const otpEmail = (otp) => {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<title>ThriftYatra OTP</title>
	<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
	<meta content="width=device-width, initial-scale=1.0" name="viewport" />
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; padding: 0; }
	</style>
</head>
<body style="background-color: #FFFFFF; margin: 0; padding: 0;">
	<table width="100%">
		<tr>
			<td>
				<table align="center" style="background-color: #f5f5f5; padding: 50px 0;" width="100%">
					<tr>
						<td>
							<table align="center" style="background-color: #ffffff; width: 500px; margin: 0 auto; border-radius: 10px;">
								<tr>
									<td style="padding: 30px; text-align: center;">
										<h1 style="color: #393d47; font-family: Arial, sans-serif; font-size: 24px;"><strong>Email Verification</strong></h1>
										<p style="color: #393d47; font-family: Arial, sans-serif; font-size: 14px;">Use this OTP to complete your verification:</p>
										<h1 style="color: #E8B931; font-family: Arial, sans-serif; font-size: 38px; font-weight: 700; letter-spacing: 5px;">${otp}</h1>
										<p style="color: #393d47; font-family: Arial, sans-serif; font-size: 13px;"><strong>Valid for 10 minutes.</strong> Do not share this OTP.</p>
										<p style="color: #999; font-family: Arial, sans-serif; font-size: 13px; margin-top: 20px;">- ThriftYatra</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
	return html;
};