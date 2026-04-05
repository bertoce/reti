import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <h1 className="text-title font-bold text-foreground">reti</h1>
          <p className="text-sm text-muted mt-2">
            Seguimiento de obra con inteligencia artificial
          </p>
        </div>

        {/* Login form */}
        <LoginForm />
      </div>
    </div>
  );
}
