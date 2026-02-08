# Lola MVP

Lola is a minimal full-stack MVP for daily outbound Spanish tutoring calls.

## Stack
- Next.js App Router (`apps/web`) for UI + API endpoints
- Prisma (`packages/db`) with SQLite local dev + Postgres-ready provider switch
- Shared validation/scheduling package (`packages/shared`)
- Voice prompt/agent logic (`packages/voice`)
- Twilio Voice outbound calls + webhooks
- OpenAI Responses API for speech-gather fallback conversation loop

## Monorepo structure
```
/apps/web
/packages/db
/packages/shared
/packages/voice
.env.example
```

## 1) Setup
```bash
npm install
cp .env.example .env
```

Set all required variables in `.env`.

### Config variables you must provide
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (fallback text model)
- `OPENAI_REALTIME_MODEL` (optional, reserved for realtime media-stream version)
- `OPENAI_VOICE` (optional)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `PUBLIC_BASE_URL`
- `TWILIO_VOICE_WEBHOOK_URL` (informational; should match `${PUBLIC_BASE_URL}/api/twilio/voice`)
- `TWILIO_STATUS_CALLBACK_URL` (informational; should match `${PUBLIC_BASE_URL}/api/twilio/status`)
- `DATABASE_URL`
- `DATABASE_PROVIDER` (`sqlite` locally, `postgresql` in production)
- `MANAGE_TOKEN_SECRET`
- `DEFAULT_TIMEZONE`
- `ALLOWED_CALL_HOURS_START`
- `ALLOWED_CALL_HOURS_END`
- `LOG_LEVEL`
- `REDIS_URL` (optional; not used in this cron MVP)

## 2) Database migrations
```bash
npm run db:generate
npm run db:migrate
```

## 3) Run app
```bash
npm run dev
```

Open `http://localhost:3000`.

## 4) Expose local webhooks via ngrok
Run ngrok against Next app:
```bash
ngrok http 3000
```
Then set `PUBLIC_BASE_URL` to your ngrok URL and configure Twilio phone number voice webhook to:
- Voice: `https://<ngrok>/api/twilio/voice`
- Status callback: `https://<ngrok>/api/twilio/status`

## 5) Scheduler/worker
This MVP uses a cron-friendly tick script. Run every minute:
```bash
npm run scheduler
```
(Or call `POST /api/scheduler/run` from an external cron.)

What scheduler does:
1. Creates next-24h call jobs based on timezone + preferred times.
2. Dispatches due jobs through Twilio.

## 6) Trigger a test call
1. Create a user from UI (or `POST /api/users`).
2. Set preferred time near current local time.
3. Run:
```bash
npm run scheduler
```
4. Twilio should place outbound call and Twilio webhook loop handles tutoring conversation.

## Voice behavior
Current MVP path is fallback mode:
- Twilio `<Gather input="speech">` captures speech
- Transcript text sent to OpenAI Responses API
- AI response played back with Twilio `<Say>`

No raw audio is stored. Only text transcript snippets are saved in `CallSession`.

## Tests
```bash
npm test
```
Includes:
- Validation schema test
- Deterministic schedule generation test
