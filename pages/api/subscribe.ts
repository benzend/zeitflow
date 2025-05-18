import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type ResponseData = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid email address' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'subscribers.json');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Read existing subscribers or create new array
    let subscribers: string[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      subscribers = JSON.parse(fileContent);
    }

    // Check if email already exists
    if (subscribers.includes(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already subscribed' });
    }

    // Add new email
    subscribers.push(email);
    fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2));

    return res
      .status(200)
      .json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to subscribe' });
  }
}
