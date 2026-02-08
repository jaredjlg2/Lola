const required = [
  'DATABASE_URL',
  'DATABASE_PROVIDER',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'PUBLIC_BASE_URL',
  'MANAGE_TOKEN_SECRET',
  'DEFAULT_TIMEZONE'
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  publicBaseUrl: process.env.PUBLIC_BASE_URL!,
  manageTokenSecret: process.env.MANAGE_TOKEN_SECRET!,
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  allowedCallHoursStart: Number(process.env.ALLOWED_CALL_HOURS_START || 9),
  allowedCallHoursEnd: Number(process.env.ALLOWED_CALL_HOURS_END || 20)
};
