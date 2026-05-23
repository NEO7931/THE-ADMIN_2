import { z } from "zod";

// ─── Common password blocklist (top breached passwords per HaveIBeenPwned) ────
const BLOCKED_PASSWORDS = new Set([
  "password123", "password1", "password", "123456789", "12345678",
  "1234567890", "qwerty123", "iloveyou", "admin123", "letmein",
  "welcome1", "monkey123", "dragon123", "master123", "sunshine1",
  "princess1", "football1", "shadow123", "superman1", "michael1",
  "abc123456", "passw0rd", "p@ssword1", "p@ssw0rd", "qwertyuiop",
  "123456abc", "test1234", "hello123", "welcome123", "pass1234",
]);

// ─── Disposable / fake email domain blocklist ─────────────────────────────────
const BLOCKED_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwam.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "guerrillamail.info",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.net", "guerrillamail.org",
  "spam4.me", "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.org",
  "dispostable.com", "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf", "10minutemail.com",
  "10minutemail.net", "10minutemail.org", "minutemail.com", "fakeinbox.com",
  "maildrop.cc", "mailnull.com", "spamgourmet.com", "spamgourmet.net",
  "spamgourmet.org", "spamspot.com", "binkmail.com", "bobmail.info",
  "dayrep.com", "discard.email", "discardmail.com", "discardmail.de",
  "einrot.com", "fleckens.hu", "kurzepost.de", "objectmail.com", "ownmail.net",
  "pecinan.com", "pepbot.com", "put2.net", "rklips.com", "rmqkr.net",
  "spamfree24.org", "webemail.me", "wegwerfmail.de", "wegwerfmail.net",
  "wegwerfmail.org", "wh4f.org", "whyspam.me", "trbvm.com", "trashmail.at",
  "crapmail.org", "filzmail.com", "spamfree.eu", "mailexpire.com",
]);

// ─── Password strength validator ──────────────────────────────────────────────
function validatePassword(password: string, username?: string) {
  const errors: string[] = [];

  if (password.length < 12)
    errors.push("At least 12 characters");
  if (!/[A-Z]/.test(password))
    errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password))
    errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(password))
    errors.push("At least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    errors.push("At least one special character (!@#$%^&* etc.)");
  if (username && password.toLowerCase().includes(username.toLowerCase()))
    errors.push("Password must not contain your username");
  if (BLOCKED_PASSWORDS.has(password.toLowerCase()))
    errors.push("This password is too common and has appeared in data breaches");

  return errors;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const RegisterBody = z.object({
  username: z.string().min(3).max(32),
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      const blocked = new Set([
        "mailinator.com","guerrillamail.com","tempmail.com","yopmail.com",
        "10minutemail.com","trashmail.com","maildrop.cc","discard.email",
        "fakeinbox.com","throwam.com","spam4.me","discardmail.com",
      ]);
      const domain = email.split("@")[1]?.toLowerCase() ?? "";
      return !blocked.has(domain);
    }, "Disposable email addresses are not allowed"),
  password: z
    .string()
    .superRefine((password, ctx) => {
      const errors = validatePassword(password);
      errors.forEach((msg) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg })
      );
    }),
  // username is passed separately for the "no username in password" check
  // We re-validate on the route handler side using the username field
});

export const LoginBody = z.object({
  username: z.string(),
  password: z.string(),
});

export const ListBooksQueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const CreateBookBody = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
});

export const GetBookParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const UpdateBookParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const UpdateBookBody = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  status: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const DeleteBookParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const CreateBorrowBody = z.object({
  bookId: z.number().int().positive(),
  borrowDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const CreateReservationBody = z.object({
  bookId: z.number().int().positive(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const RejectRequestBody = z.object({
  rejectionReason: z.string().min(1),
});

export const WaiveFineBody = z.object({
  waiveReason: z.string().min(1),
});

export const UpdateFineSettingsBody = z.object({
  dailyRate: z.number().positive().optional(),
  maxFinePerBook: z.number().positive().optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  defaultBorrowDays: z.number().int().positive().optional(),
});

export const CreatePaymentSessionBody = z.object({
  fineId: z.number().int().positive(),
});

export const ListAdminRequestsQueryParams = z.object({
  status: z.string().optional(),
});

export const ListAllReservationsQueryParams = z.object({
  status: z.string().optional(),
});

export const HealthCheckResponse = z.object({
  status: z.literal("ok"),
});

// Export the validator for use in auth routes (username-aware check)
export { validatePassword };