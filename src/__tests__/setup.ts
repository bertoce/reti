// Global test setup
import "@testing-library/jest-dom/vitest";

// Mock environment variables for all tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
process.env.WASENDER_API_KEY = "test-wasender-key";
process.env.WASENDER_SESSION_ID = "test-session-id";
process.env.WASENDER_WEBHOOK_SECRET = "test-webhook-secret";
process.env.GROQ_API_KEY = "gsk_test-groq-key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
