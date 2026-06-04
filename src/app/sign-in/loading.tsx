export default function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" aria-hidden />
    </div>
  )
}
