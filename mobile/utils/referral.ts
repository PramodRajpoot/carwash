import { API_BASE } from '../constants/api';

export const getReferralLink = (code?: string, baseUrl?: string): string => {
  const cleanCode = (code || 'CARWASH').trim().toUpperCase();
  const domain = (baseUrl || API_BASE || 'http://187.126.119.129').replace(/\/+$/, '');
  return `${domain}/register?ref=${encodeURIComponent(cleanCode)}`;
};

export const buildReferralMessage = (code?: string, baseUrl?: string): string => {
  const cleanCode = (code || 'CARWASH').trim().toUpperCase();
  const referralLink = getReferralLink(cleanCode, baseUrl);

  return `🚗💰 EARN MONEY WITH CLEANATDOORSTEP!

Greetings of the Day! 👋

Introducing CLEANATDOORSTEP PVT. LTD. — a growing doorstep car wash brand with 80+ outlets across India! 🇮🇳

💸 ZERO INVESTMENT
Start earning without investing a single rupee!

📱 JUST REFER & EARN
Share our car wash services with your friends, family & contacts.

🚘 NO SERVICE WORK
Our professional team handles car cleaning. You just refer customers!

💰 EARN ON SUCCESSFUL REFERRALS
Get rewarded when your referred customers book eligible services.

🏠 DOORSTEP CAR WASH
Professional car cleaning at home, starting from ₹299!*

✨ Your Smartphone Can Become Your Earning Partner!

🔗 REGISTER & START EARNING TODAY
👉 ${referralLink}

🚗 CLEANATDOORSTEP
Refer More • Earn More • Grow Together!

*Service prices and referral rewards are subject to applicable terms.`;
};
