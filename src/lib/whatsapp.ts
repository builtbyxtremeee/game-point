export async function sendWhatsAppMessage(
  destination: string,
  campaignName: string,
  userName: string,
  templateParams: string[]
): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error('WhatsApp credentials are not defined in environment variables');
    return false;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: destination,
        type: 'template',
        template: {
          name: campaignName,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsApp API error response:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message via Meta Cloud API:', error);
    return false;
  }
}
