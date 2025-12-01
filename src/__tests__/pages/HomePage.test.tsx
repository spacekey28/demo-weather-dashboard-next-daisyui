// Mock next/navigation redirect
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Next.js redirect throws a special error
    const error = new Error('NEXT_REDIRECT');
    (error as Error & { digest?: string }).digest = 'NEXT_REDIRECT';
    throw error;
  },
}));

import HomePage from '@/app/page';

describe('Homepage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /dashboard', () => {
    // redirect throws an error in Next.js, so we need to catch it
    try {
      HomePage();
      // If we get here, redirect didn't throw (shouldn't happen)
      fail('Expected redirect to throw an error');
    } catch (error: unknown) {
      // Expected behavior - redirect throws NEXT_REDIRECT error
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('NEXT_REDIRECT');
    }
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it('redirects to correct path', () => {
    try {
      HomePage();
    } catch {
      // Expected - redirect throws
    }
    // Verify the redirect path is exactly '/dashboard'
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});
