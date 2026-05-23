import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/openapi.json", (_req, res) => {
  // Return minimal spec inline — avoids large module import issues on Vercel
  res.json({
    openapi: "3.0.3",
    info: { title: "LibCore API", version: "1.0.0", description: "LibCore library management REST API." },
    servers: [{ url: "/api", description: "Current deployment" }],
    paths: {
      "/healthz": { get: { summary: "Liveness probe", security: [], responses: { 200: { description: "ok" } } } },
      "/auth/register": { post: { summary: "Register", security: [], responses: { 201: { description: "Created" } } } },
      "/auth/login": { post: { summary: "Login", security: [], responses: { 200: { description: "Logged in" } } } },
      "/auth/logout": { post: { summary: "Logout", responses: { 200: { description: "Logged out" } } } },
      "/auth/me": { get: { summary: "Current user", responses: { 200: { description: "User object" } } } },
      "/auth/verify-otp": { post: { summary: "Verify OTP", security: [], responses: { 200: { description: "Verified" } } } },
      "/auth/resend-otp": { post: { summary: "Resend OTP", security: [], responses: { 200: { description: "Sent" } } } },
      "/books": { get: { summary: "List books", security: [], responses: { 200: { description: "Books array" } } }, post: { summary: "Create book (staff)", responses: { 200: { description: "Created" } } } },
      "/books/categories": { get: { summary: "List categories", security: [], responses: { 200: { description: "Categories" } } } },
      "/books/{id}": { get: { summary: "Get book", security: [], responses: { 200: { description: "Book" } } }, put: { summary: "Update book (staff)", responses: { 200: { description: "Updated" } } }, delete: { summary: "Delete book (staff)", responses: { 204: { description: "Deleted" } } } },
      "/borrow": { get: { summary: "My borrows", responses: { 200: { description: "List" } } }, post: { summary: "Request borrow", responses: { 200: { description: "Created" } } } },
      "/borrow/{id}/return": { patch: { summary: "Return book", responses: { 200: { description: "Returned" } } } },
      "/reservations": { get: { summary: "My reservations", responses: { 200: { description: "List" } } }, post: { summary: "Create reservation", responses: { 200: { description: "Created" } } } },
      "/history": { get: { summary: "Borrow history", responses: { 200: { description: "Paginated history" } } } },
      "/fines/my": { get: { summary: "My fines", responses: { 200: { description: "Fines" } } } },
      "/fines/settings": { get: { summary: "Fine settings", responses: { 200: { description: "Settings" } } } },
      "/notifications": { get: { summary: "Notifications", responses: { 200: { description: "List" } } } },
      "/admin/stats": { get: { summary: "Dashboard stats", responses: { 200: { description: "Stats" } } } },
      "/admin/requests": { get: { summary: "Borrow requests", responses: { 200: { description: "List" } } } },
      "/admin/approve/{id}": { put: { summary: "Approve request", responses: { 200: { description: "Approved" } } } },
      "/admin/reject/{id}": { put: { summary: "Reject request", responses: { 200: { description: "Rejected" } } } },
      "/admin/users": { get: { summary: "All users", responses: { 200: { description: "Users" } } } },
      "/admin/users/{id}/ban": { put: { summary: "Ban user", responses: { 200: { description: "Banned" } } } },
      "/admin/users/{id}/unban": { put: { summary: "Unban user", responses: { 200: { description: "Unbanned" } } } },
      "/admin/users/{id}/suspend": { put: { summary: "Suspend user", responses: { 200: { description: "Suspended" } } } },
      "/admin/users/{id}/unsuspend": { put: { summary: "Unsuspend user", responses: { 200: { description: "Unsuspended" } } } },
      "/admin/users/{id}/role": { put: { summary: "Change role (admin)", responses: { 200: { description: "Updated" } } } },
      "/admin/users/{id}/permanent": { delete: { summary: "Hard delete user (admin)", responses: { 200: { description: "Deleted" } } } },
      "/admin/books/{id}/status": { patch: { summary: "Override book status (staff)", responses: { 200: { description: "Updated" } } } },
      "/admin/reservations": { get: { summary: "All reservations", responses: { 200: { description: "List" } } } },
      "/admin/reservations/approve/{id}": { put: { summary: "Approve reservation", responses: { 200: { description: "Approved" } } } },
      "/admin/reservations/reject/{id}": { put: { summary: "Reject reservation", responses: { 200: { description: "Rejected" } } } },
    },
  });
});

router.get("/docs", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LibCore API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        requestInterceptor: (req) => { req.credentials = "include"; return req; },
      });
    </script>
  </body>
</html>`);
});

export default router;