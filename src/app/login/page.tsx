import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background bg-stars-faint flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-16">
          <h1 className="text-display text-foreground tracking-tight">reti</h1>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Seguimiento de obra con inteligencia artificial
          </p>
        </div>

        {/* Login form */}
        <LoginForm />

        {/* Footer */}
        <p className="text-center text-xs text-muted/50 mt-16">
          Un enlace de acceso se enviará a tu correo
        </p>
      </div>
    </div>
  );
}
