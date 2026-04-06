import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background bg-stars flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        {/* Brand */}
        <div className="text-center mb-20">
          <h1 className="text-display text-foreground">reti</h1>
          <p className="text-sm text-muted mt-4 leading-relaxed tracking-wide">
            seguimiento de obra
          </p>
        </div>

        {/* Login form */}
        <LoginForm />
      </div>
    </div>
  );
}
