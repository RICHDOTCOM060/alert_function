// netlify/functions/log-visitor.js

exports.handler = async function (event, context) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Updated CORS headers: expanded allowed headers for browser preflight checks
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle HTTP OPTIONS (Preflight check) - returning 204 No Content
    if (event.httpMethod === "OPTIONS") {
        return { 
            statusCode: 204,
            headers,
            body: "" 
        };
    }

    try {
        let requestBody = {};
        if (event.body) {
            requestBody = JSON.parse(event.body);
        }

        // Netlify normalizes incoming request headers to lower-case
        const incomingHeaders = event.headers || {};
        const visitorIp = incomingHeaders['x-nf-client-connection-ip'] ||
            incomingHeaders['client-ip'] ||
            incomingHeaders['x-forwarded-for'] ||
            'Unknown IP';

        const countryCode = incomingHeaders['x-country'] || 'Unknown Country';

        const siteName = requestBody.siteName || 'Generic Static Site';
        const OSNAME = requestBody.OSNAME || 'Unknown OS';

        let messageToSend = "";

        if (requestBody.message) {
            messageToSend = `
💻 *Alert from:* ${siteName}
💬 *Message:* ${requestBody.message}
🖥️ *OS:* ${OSNAME}
🌐 *Visitor IP:* ${visitorIp}
            `.trim();
        } else {
            messageToSend = `
🔔 *New Visitor*
🏢 *Site:* ${siteName}
🖥️ *OS:* ${OSNAME}
🌐 *IP:* ${visitorIp}
📍 *Country:* ${countryCode}
            `.trim();
        }

        if (botToken && chatId && messageToSend) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: messageToSend,
                    parse_mode: 'Markdown'
                })
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: "Success",
                ip: visitorIp,
                country: countryCode
            }),
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Failed to process request" }),
        };
    }
};
