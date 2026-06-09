# ServiceHub Backend Render Checklist

Use these settings when creating the Render Web Service.

## Render service settings

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Runtime: Node

## Required environment variables

Copy the variable names from `.env.example` into Render Environment.

Set these values carefully:

- `MONGO_URI`: MongoDB Atlas connection string
- `MONGO_DB_NAME`: `all_in_one_services`
- `JWT_SECRET`:
- `AUTH_REQUIRE_EMAIL_OTP`: `true`
- `CLIENT_URL`:
- `BREVO_SMTP_HOST`: `smtp-relay.brevo.com`
- `BREVO_SMTP_PORT`: `587`
- `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `MAIL_FROM_EMAIL`: your Brevo email values

Generate a strong JWT secret locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Do not copy these laptop-only values to Render

Only use these on Render if Atlas SRV DNS fails there:

- `MONGO_DNS_SERVERS`
- `MONGO_DIRECT_HOSTS`
- `MONGO_REPLICA_SET`

## Test after deploy

Open this in a browser:

```text
https://your-render-service.onrender.com/api/health
```

Expected result:

```json
{
  "status": "ok",
  "database": "connected"
}
```

