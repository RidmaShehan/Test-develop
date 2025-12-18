import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Redirect to sign-in page
  redirect('/sign-in')
}