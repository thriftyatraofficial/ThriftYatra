const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

export const sendWhatsAppTemplate = async (phone, templateName, variables = {}) => {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        return { success: false, message: 'WhatsApp is not configured.' };
    }

    const formattedPhone = String(phone || '').replace(/[^0-9]/g, '');
    const whatsappPhone = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone}`;
    const bodyParams = Object.values(variables).map((value) => ({
        type: 'text',
        text: String(value)
    }));

    const apiResponse = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: whatsappPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' },
                components: bodyParams.length > 0
                    ? [{ type: 'body', parameters: bodyParams }]
                    : []
            }
        })
    });

    const result = await apiResponse.json();
    if (!apiResponse.ok) {
        return { success: false, result, message: 'WhatsApp provider rejected the message.' };
    }

    return { success: true, result };
};
