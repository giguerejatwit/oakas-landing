const https = require('https');
const fs = require('fs');
const path = require('path');

function stripeRequest(sessionId) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(process.env.STRIPE_SECRET + ':').toString('base64');
    const req = https.request({
      hostname: 'api.stripe.com',
      path: `/v1/checkout/sessions/${sessionId}`,
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.writeHead(302, { Location: '/' }).end();
  }

  try {
    const session = await stripeRequest(sessionId);

    if (session.payment_status === 'paid' || session.status === 'complete') {
      // Serve the download page
      const html = fs.readFileSync(path.join(__dirname, '..', '_download.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.end(html);
    } else {
      return res.writeHead(302, { Location: '/' }).end();
    }
  } catch (err) {
    return res.writeHead(302, { Location: '/' }).end();
  }
};
