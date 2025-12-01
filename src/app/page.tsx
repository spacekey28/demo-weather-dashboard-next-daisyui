import { redirect } from 'next/navigation';

/**
 * Home page - redirects to dashboard
 * Server-side redirect to /dashboard
 */
export default function HomePage() {
  redirect('/dashboard');
}
