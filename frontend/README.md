# Student ERP — Frontend

React 19 + TypeScript + Vite + Tailwind front end for the Spring Boot Student ERP
backend in the parent directory.

## Running

The backend must be up first (PostgreSQL on 5432, Spring Boot on 8080):

```bash
# from the repository root
./mvnw spring-boot:run
```

Then:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`npm run build` produces `dist/`, `npm run typecheck` runs `tsc` alone.

Vite proxies `/api` to `http://localhost:8080`, so no base URL configuration is
needed in development. The backend also allows CORS from `localhost:5173` and
`localhost:4173` directly, which covers `npm run preview` and a separately
hosted build.

## First run

There is **no public sign-up**: `/api/auth/register` requires an admin token, so
the first administrator is created by the backend at start-up instead. Set a
password before the first boot against an empty database:

```bash
# Windows PowerShell
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = "choose-a-strong-password"
./mvnw spring-boot:run
```

That creates `admin@studenterp.local` (override with
`APP_BOOTSTRAP_ADMIN_EMAIL`). If no admin exists and no password is set, the
application logs a warning and creates nothing. Once an admin exists the
bootstrap does nothing on later starts, and further accounts are created from
**Portal Accounts** in the admin portal.

Then build the academic structure in this order:

1. Sign in as the administrator, then add **Departments** and **Courses**
   (everything else references them).
2. Add **Subjects** per course + semester.
3. Add **Students**, and **Faculty** — then use *Login* on a faculty row to issue
   their portal account.
4. Allocate subjects to faculty under **Subject Allocation**. Attendance and
   assignments are both keyed to these allocations, so this step is what makes
   the faculty portal usable.
5. Optionally add **Timetable** periods, **Examinations**, **Fee structures**,
   **Notices**, **Library** stock, **Hostel** rooms and **Transport** routes.

Two identity rules the backend enforces, worth knowing up front:

- A **student** logs in with a `STUDENT` account whose email matches the `email`
  on their student record — that is how `/api/student/**` resolves who you are.
- A **faculty** login must be created through the admin *Login* action, which
  links the user account to the faculty record.

## Layout

```
src/
  api/
    types.ts       mirrors every backend DTO and enum
    client.ts      fetch wrapper: JWT header, error parsing, file downloads
    endpoints.ts   one typed function per backend endpoint
  components/      ui primitives, app shell, shared timetable + leave views
  context/         auth session (token, role, name) in localStorage
  lib/             formatting, useAsync, department/course lookups
  pages/
    Landing.tsx    animated public home page at /
    Profile.tsx    shared: account details + change password
    Notices.tsx    shared: role-filtered notice board
    admin/         students, faculty, academics, subjects, allocation,
                   timetable, exams, fees, leaves, notices, library,
                   hostel, transport, portal accounts
    faculty/       dashboard, attendance, assignments, timetable, leaves
    student/       dashboard, attendance, assignments, results, timetable,
                   fees, leaves, library, hostel & transport
```

Routing is role-guarded in `App.tsx`: each portal checks the role stored at
login and redirects elsewhere if it does not match. This is navigation only —
authorisation is enforced by Spring Security on every request.

## Notes on backend behaviour

- **Student identity.** There is no `/api/student/me`. The fee dashboard
  resolves the logged-in student by email and returns their numeric id, so it
  doubles as the identity lookup (see `pages/student/useStudentId.ts`), which
  the attendance endpoint needs.
- **Online fee payment.** Students pay their own fees from the fee page through
  Razorpay checkout: `POST /api/student/fees/razorpay/orders` opens an order and
  `POST /api/student/fees/razorpay/verify` settles it. Both resolve the fee
  against the signed-in student, so another student's fee ID is rejected. The
  amount credited comes from the stored order rather than the request, and the
  payment is always recorded with method `ONLINE`. Receipts follow the same
  ownership rule: `GET /api/student/fees/student-fees/{id}/payments` lists a
  fee's payments and `GET /api/student/fees/payments/{id}/receipt/pdf` renders
  the PDF, both refusing another student's record. The fee page offers the
  receipt straight after a payment and keeps it reachable from the per-fee
  **Receipts** dialog. The admin equivalents under
  `/api/admin/fees/**` are unchanged. Checkout needs `RAZORPAY_KEY_ID`
  and `RAZORPAY_KEY_SECRET` set on the backend; without them the call fails with
  "Razorpay is not configured".
- **Error shape.** Every failure returns
  `{timestamp, status, error, message, path, fieldErrors?}` with a real HTTP
  status (400 / 401 / 403 / 404 / 409 / 413 / 500). The client reads `message`,
  and prefers a `fieldErrors` entry when one is present so forms can point at
  the field that needs fixing.
- **Route authorisation.** `/api/students/**` and `/api/admin/**` are admin-only,
  `/api/faculty/**` and `/api/student/**` are scoped to their role, and
  `/api/me/**` is open to any signed-in user. `/api/auth/login` and
  `/api/auth/signup` are the only public routes.
- **Sign-up vs register.** Two separate endpoints on purpose. `POST
  /api/auth/signup` is public and takes no role — `SignupRequest` has no such
  field and the service hard-codes STUDENT, so a caller cannot mint an
  administrator. `POST /api/auth/register` does take a role and therefore stays
  admin-only, behind `/admin/users`. A self-registered login has no student
  record behind it until an admin links one, which the sign-up confirmation
  says outright.
- **Profile photo.** Any signed-in role sets its own photo from the profile page
  through `POST /api/me/photo` (JPG or PNG). Each role keeps the photo on the
  record that already owns it — students on their student record, so a
  self-service upload is the same picture the admin student list reads, faculty
  on theirs, and admins on the account itself since they own neither. The photo
  is read back from `GET /api/me/photo` rather than served as a static file, so
  it stays behind authentication; the client fetches it as a blob because an
  `<img src>` cannot send the bearer token.
- **Assignments.** An assignment belongs to a faculty-subject allocation, so
  students see exactly the work set for their course, semester and section.
  A submission can be replaced until it has been marked.
