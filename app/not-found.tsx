import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold font-mono text-mint">404</div>
        <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
        <p className="text-sm text-text-secondary max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/spot"
            className="px-5 py-2.5 rounded-xl bg-mint text-bg-base font-semibold text-sm hover:bg-mint-dark transition-colors"
          >
            Start Trading
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
