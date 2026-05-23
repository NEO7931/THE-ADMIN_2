import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token found.");
      return;
    }

    authApi.verifyEmail(token)
      .then((data: any) => {
        setStatus("success");
        setMessage(data.message ?? "Email verified successfully!");
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.message ?? "Verification failed. The link may have expired.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-2xl font-serif">
            <BookOpen className="h-7 w-7" /> LIBCORE
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-5">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email…</h2>
              <p className="text-gray-400 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-5">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-gray-500 mb-8">{message}</p>
              <Link href="/login"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In Now
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center mb-5">
                <div className="bg-red-100 rounded-full p-4">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-gray-500 mb-8">{message}</p>
              <div className="space-y-3">
                <Link href="/register"
                  className="block bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Register Again
                </Link>
                <Link href="/login" className="block text-sm text-gray-400 hover:text-gray-600">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}