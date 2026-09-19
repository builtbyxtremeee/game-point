import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — GamePoint',
  description: 'Sign in to GamePoint Sports Academy Management.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
