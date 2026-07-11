-- Create userPhone table for SMS-based authentication
CREATE TABLE IF NOT EXISTS "userPhone" (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "birthDate" TEXT NOT NULL,
  "subscriptionPlan" TEXT NOT NULL DEFAULT 'free',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create otpVerification table for OTP storage
CREATE TABLE IF NOT EXISTS "otpVerification" (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_userphone_phone ON "userPhone"(phone);
CREATE INDEX IF NOT EXISTS idx_userphone_verified ON "userPhone"("isVerified");
CREATE INDEX IF NOT EXISTS idx_otpverification_phone ON "otpVerification"(phone);
CREATE INDEX IF NOT EXISTS idx_otpverification_expiresat ON "otpVerification"("expiresAt");
