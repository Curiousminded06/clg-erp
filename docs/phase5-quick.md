# Phase 5 Quick Hardening Checklist

This quick pass gives a deploy-ready baseline without a full enterprise pipeline.

## Security Baseline

- Do not commit real credentials in example files.
- Use a strong `JWT_ACCESS_SECRET` (32+ chars).
- Keep production CORS allow-list explicit.
- Ensure protected endpoints return `401/403` for unauthenticated/unauthorized users.

## Runtime Health

- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready`
- Basic status: `GET /api/health`

Readiness returns `503` while MongoDB is not connected.

## Quick Verification Commands

From repository root:

- `npm run build`
- `npm run smoke`
- `npm run phase5:quick`

Environment override for smoke target:

- PowerShell: `$env:SMOKE_BASE_URL='https://your-api-host/api'; npm run smoke`

## Minimum Pre-Release Gate

- Build passes.
- Smoke checks pass.
- Health ready endpoint returns `200` in deployment target.
- No placeholder secrets remain in runtime `.env`.
