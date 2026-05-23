// OpenAPI 3.0 specification for the LibCore library API.
// Served as JSON at GET /api/openapi.json and rendered by Swagger UI at GET /api/docs.
//
// This is a complete, accurate starting point generated from your routes and zod
// schemas. Extend the response schemas (most are currently `object` placeholders)
// as you firm up exact response shapes.

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LibCore API",
    version: "1.0.0",
    description:
      "REST API for the LibCore library management system (books, borrowing, reservations, fines, payments, notifications, admin and analytics). Authentication is cookie-based: log in via /auth/login, and the session cookie is sent automatically on subsequent requests.",
  },
  // Paths below are relative to this server base, so the full URL is e.g. /api/auth/login
  servers: [{ url: "/api", description: "Current deployment" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Books" },
    { name: "Borrow" },
    { name: "Reservations" },
    { name: "History" },
    { name: "Fines" },
    { name: "Notifications" },
    { name: "Payments" },
    { name: "Admin" },
    { name: "Analytics" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "Signed session cookie set by /auth/login.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        example: { error: "Unauthorized" },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "jdoe" },
          email: { type: "string", format: "email", example: "jdoe@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Book: {
        type: "object",
        properties: {
          id: { type: "integer", example: 12 },
          code: { type: "string", example: "QA76-001" },
          title: { type: "string", example: "Clean Code" },
          author: { type: "string", example: "Robert C. Martin" },
          category: { type: "string", example: "Software" },
          imageUrl: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["available", "borrowed", "reserved"],
            example: "available",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      RegisterBody: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 32 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      LoginBody: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
      },
      CreateBookBody: {
        type: "object",
        required: ["code", "title", "author", "category"],
        properties: {
          code: { type: "string" },
          title: { type: "string" },
          author: { type: "string" },
          category: { type: "string" },
          imageUrl: { type: "string", format: "uri", nullable: true },
        },
      },
      UpdateBookBody: {
        type: "object",
        properties: {
          code: { type: "string" },
          title: { type: "string" },
          author: { type: "string" },
          category: { type: "string" },
          status: { type: "string" },
          imageUrl: { type: "string", format: "uri", nullable: true },
        },
      },
      CreateBorrowBody: {
        type: "object",
        required: ["bookId", "borrowDate"],
        properties: {
          bookId: { type: "integer" },
          borrowDate: { type: "string", example: "2026-05-23", description: "YYYY-MM-DD" },
          returnDate: { type: "string", example: "2026-06-06", description: "YYYY-MM-DD" },
        },
      },
      CreateReservationBody: {
        type: "object",
        required: ["bookId", "pickupDate", "returnDate"],
        properties: {
          bookId: { type: "integer" },
          pickupDate: { type: "string", example: "2026-05-25", description: "YYYY-MM-DD" },
          returnDate: { type: "string", example: "2026-06-08", description: "YYYY-MM-DD" },
        },
      },
      RejectRequestBody: {
        type: "object",
        required: ["rejectionReason"],
        properties: { rejectionReason: { type: "string", minLength: 1 } },
      },
      WaiveFineBody: {
        type: "object",
        required: ["waiveReason"],
        properties: { waiveReason: { type: "string", minLength: 1 } },
      },
      UpdateFineSettingsBody: {
        type: "object",
        properties: {
          dailyRate: { type: "number" },
          maxFinePerBook: { type: "number" },
          gracePeriodDays: { type: "integer", minimum: 0 },
          defaultBorrowDays: { type: "integer", minimum: 1 },
        },
      },
      CreatePaymentSessionBody: {
        type: "object",
        required: ["fineId"],
        properties: { fineId: { type: "integer" } },
      },
    },
    responses: {
      Unauthorized: {
        description: "Not authenticated",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Authenticated but not authorized (admin only)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Request failed validation",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  // Authentication is required by default; individual public endpoints clear it with `security: []`.
  security: [{ sessionCookie: [] }],
  paths: {
    "/healthz": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        security: [],
        responses: {
          200: {
            description: "Service is up",
            content: {
              "application/json": {
                schema: { type: "object", properties: { status: { type: "string", example: "ok" } } },
              },
            },
          },
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create a new account",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
        },
        responses: {
          200: { description: "Registered", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          400: { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and start a session",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
        },
        responses: {
          200: { description: "Logged in (sets session cookie)", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "End the current session", responses: { 200: { description: "Logged out" } } },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current logged-in user",
        responses: {
          200: { description: "Current user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/books": {
      get: {
        tags: ["Books"],
        summary: "List books",
        security: [],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Array of books", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Book" } } } } },
        },
      },
      post: {
        tags: ["Books"],
        summary: "Create a book (admin)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBookBody" } } } },
        responses: {
          200: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Book" } } } },
          400: { $ref: "#/components/responses/ValidationError" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/books/categories": {
      get: {
        tags: ["Books"],
        summary: "List distinct categories",
        security: [],
        responses: { 200: { description: "Array of category names", content: { "application/json": { schema: { type: "array", items: { type: "string" } } } } } },
      },
    },
    "/books/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      get: {
        tags: ["Books"],
        summary: "Get a book by id",
        security: [],
        responses: { 200: { description: "Book", content: { "application/json": { schema: { $ref: "#/components/schemas/Book" } } } }, 404: { $ref: "#/components/responses/NotFound" } },
      },
      put: {
        tags: ["Books"],
        summary: "Update a book (admin)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateBookBody" } } } },
        responses: { 200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Book" } } } }, 403: { $ref: "#/components/responses/Forbidden" } },
      },
      delete: {
        tags: ["Books"],
        summary: "Delete a book (admin)",
        responses: { 204: { description: "Deleted" }, 403: { $ref: "#/components/responses/Forbidden" } },
      },
    },

    "/borrow": {
      get: { tags: ["Borrow"], summary: "List my borrow transactions", responses: { 200: { description: "Array of transactions", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } },
      post: {
        tags: ["Borrow"],
        summary: "Request to borrow a book",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBorrowBody" } } } },
        responses: { 200: { description: "Borrow request created", content: { "application/json": { schema: { type: "object" } } } }, 400: { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/borrow/{id}/return": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      patch: { tags: ["Borrow"], summary: "Return a borrowed book", responses: { 200: { description: "Returned", content: { "application/json": { schema: { type: "object" } } } } } },
    },

    "/reservations": {
      get: { tags: ["Reservations"], summary: "List my reservations", responses: { 200: { description: "Array of reservations", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } },
      post: {
        tags: ["Reservations"],
        summary: "Create a reservation",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateReservationBody" } } } },
        responses: { 200: { description: "Reservation created", content: { "application/json": { schema: { type: "object" } } } }, 400: { $ref: "#/components/responses/ValidationError" } },
      },
    },

    "/history": {
      get: {
        tags: ["History"],
        summary: "Paginated borrow history",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Paginated history", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },

    "/fines/my": { get: { tags: ["Fines"], summary: "My fines", responses: { 200: { description: "Fines for the current user", content: { "application/json": { schema: { type: "object" } } } } } } },
    "/fines": {
      get: { tags: ["Fines"], summary: "All fines (admin)", parameters: [{ name: "status", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Fines", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } },
    },
    "/fines/settings": {
      get: { tags: ["Fines"], summary: "Get fine settings", responses: { 200: { description: "Settings", content: { "application/json": { schema: { type: "object" } } } } } },
      patch: { tags: ["Fines"], summary: "Update fine settings (admin)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateFineSettingsBody" } } } }, responses: { 200: { description: "Updated", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } },
    },
    "/fines/{id}/waive": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      post: { tags: ["Fines"], summary: "Waive a fine (admin)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WaiveFineBody" } } } }, responses: { 200: { description: "Waived", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } },
    },

    "/notifications": {
      get: { tags: ["Notifications"], summary: "List notifications", parameters: [{ name: "is_read", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Notifications", content: { "application/json": { schema: { type: "object" } } } } } },
    },
    "/notifications/read-all": { patch: { tags: ["Notifications"], summary: "Mark all as read", responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "object" } } } } } } },
    "/notifications/{id}/read": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      patch: { tags: ["Notifications"], summary: "Mark one as read", responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "object" } } } } } },
    },

    "/payments/create-session": {
      post: { tags: ["Payments"], summary: "Create a Stripe checkout session for a fine", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePaymentSessionBody" } } } }, responses: { 200: { description: "Session created", content: { "application/json": { schema: { type: "object" } } } } } },
    },
    "/payments/my": { get: { tags: ["Payments"], summary: "My payments", responses: { 200: { description: "Payments", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } } },

    "/admin/stats": { get: { tags: ["Admin"], summary: "Dashboard stats (admin)", responses: { 200: { description: "Stats", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/requests": { get: { tags: ["Admin"], summary: "Borrow requests (admin)", parameters: [{ name: "status", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Requests", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/approve/{id}": { put: { tags: ["Admin"], summary: "Approve a borrow request (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Approved", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/reject/{id}": { put: { tags: ["Admin"], summary: "Reject a borrow request (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RejectRequestBody" } } } }, responses: { 200: { description: "Rejected", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/transactions": { get: { tags: ["Admin"], summary: "All transactions (admin)", responses: { 200: { description: "Transactions", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/reservations": { get: { tags: ["Admin"], summary: "All reservations (admin)", parameters: [{ name: "status", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Reservations", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/reservations/approve/{id}": { put: { tags: ["Admin"], summary: "Approve a reservation (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Approved", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/admin/reservations/reject/{id}": { put: { tags: ["Admin"], summary: "Reject a reservation (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RejectRequestBody" } } } }, responses: { 200: { description: "Rejected", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },

    "/analytics/overview": { get: { tags: ["Analytics"], summary: "Overview metrics (admin)", responses: { 200: { description: "Overview", content: { "application/json": { schema: { type: "object" } } } }, 403: { $ref: "#/components/responses/Forbidden" } } } },
    "/analytics/borrow-trends": { get: { tags: ["Analytics"], summary: "Borrow trends over time", parameters: [{ name: "from", in: "query", schema: { type: "string" } }, { name: "to", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Trends", content: { "application/json": { schema: { type: "object" } } } } } } },
    "/analytics/top-books": { get: { tags: ["Analytics"], summary: "Most borrowed books", parameters: [{ name: "limit", in: "query", schema: { type: "integer" } }, { name: "from", in: "query", schema: { type: "string" } }, { name: "to", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Top books", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } } },
    "/analytics/request-status": { get: { tags: ["Analytics"], summary: "Request status breakdown", responses: { 200: { description: "Status breakdown", content: { "application/json": { schema: { type: "object" } } } } } } },
    "/analytics/fine-collection": { get: { tags: ["Analytics"], summary: "Fine collection over time", responses: { 200: { description: "Collection data", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } } },
    "/analytics/student-activity": { get: { tags: ["Analytics"], summary: "Most active students", parameters: [{ name: "limit", in: "query", schema: { type: "integer" } }], responses: { 200: { description: "Activity", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } } } },
  },
} as const;