<!-- Quick links -->
**Live (frontend):** https://assessment-advanced-fe.vercel.app  
**Backend Swagger:** https://assessment-advanced-be-latest-1.onrender.com/swagger/  
**Backend source:** https://github.com/RUYANGA/Assessment-Advanced-be

# MedLink — Frontend (Next.js)

Professional frontend for MedLink: a lightweight purchase-request, approval and finance management UI.  
Built with Next.js, React, TypeScript and Tailwind CSS. Integrates with a REST API for authentication, approvals and purchase order management.

## Live demo
The frontend is deployed and available at:
- https://assessment-advanced-fe.vercel.app

## Backend (API)
- Swagger / OpenAPI documentation (backend):  
  https://assessment-advanced-be-latest-1.onrender.com/swagger/
- Backend repository (source):  
  https://github.com/RUYANGA/Assessment-Advanced-be

## Features
- Token-based authentication and session persistence.
- Role-aware interfaces:
  - Finance: purchase order listing and PO detail (view/delete).
  - Staff: create and manage purchase requests.
  - Approver (single or two-level): review, approve and reject requests.
- Robust approval data handling across varying backend response shapes:
  - Supports `/approvals/mine/` and `/approvals/mine/rejected/`.
- Centralized API client that persists tokens and injects Authorization header.

## Repository highlights
- `src/lib/api.ts` — axios client and `setAuthToken` helper.
- `src/components/login-form.tsx` — login UI and authentication flow.
- `src/components/finance/oder/viewSingleOrder.tsx` — PO detail view (includes back/delete controls).
- `src/components/approval/overview/services/staffService.ts` — approval/request fetchers and normalizers.
- `src/components/approval/approve/single/hooks/useRequestDetails.ts` — resilient hook to resolve request details from multiple endpoints.

## Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm / npm / yarn

## Environment
Create `.env.local` at the frontend root:

```dotenv
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

Set the exact backend base URL (include `/api` if your backend prefixes endpoints).

## Development
Install dependencies and run the dev server:

```bash
pnpm install     # or npm install / yarn
pnpm dev
# Open http://localhost:3000
```

Build and start production:

```bash
pnpm build
pnpm start
```

## API expectations
- Token endpoint (example): `/auth/token/` or `/api/auth/token/` — confirm with backend.
- Login payload must match backend schema (e.g., `{ email, password }` or `{ username, password }`).
- Approval actions:
  - POST `/purchases/requests/{id}/approve/`
  - POST `/purchases/requests/{id}/reject/`
  Services attempt PATCH/PUT fallbacks if POST is not allowed.

## Troubleshooting
- CORS / preflight errors: enable CORS on the backend (e.g., `django-cors-headers` and add `CorsMiddleware`) and allow your frontend origin.
- 400 on token POST: confirm endpoint path and payload shape. Use curl to inspect server response.
- Env var issues: restart dev server after changing `.env.local`.

## Deployment
- Deployed to Vercel: https://assessment-advanced-fe.vercel.app  
- Backend Swagger: https://assessment-advanced-be-latest-1.onrender.com/swagger/  
- Backend source: https://github.com/RUYANGA/Assessment-Advanced-be  
- Ensure `NEXT_PUBLIC_API_URL` is configured in the hosting environment.

## Contributing
- Fork, create a feature branch, run linters/tests, submit a PR with a clear description.
- Keep UI accessible and add unit tests for core hooks/services when possible.

## License
Add project license information here (e.g., MIT).
