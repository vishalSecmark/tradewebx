// pages/api/pledge-setup.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, DPId, ReqId, Version');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.post(
      'https://mockapiweb.cdslindia.com/APIServices/pledgeapi/pledgesetup',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'DPId': 'dgeeb',
          'ReqId': '2905250341486506',
          'Version': '1.0',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || 'Something went wrong',
    });
  }
}
