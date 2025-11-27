import { NextResponse } from 'next/server';

import { buildUrl, isValidAU_NZCoords } from '@/lib/open-meteo';
import { ZDaily, ZHourly } from '@/lib/schema';

export const revalidate = 300; // 5 min

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(url: string, maxAttempts = 3): Promise<Response> {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { next: { revalidate } });
      if (response.ok) {
        return response;
      }
      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts - 1) {
        await sleep(delays[attempt]);
      }
    } catch (error) {
      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts - 1) {
        await sleep(delays[attempt]);
      } else {
        throw error;
      }
    }
  }

  // If we get here, all attempts failed
  throw new Error('All retry attempts failed');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract parameters
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const gran = (searchParams.get('gran') ?? 'hourly') as 'hourly' | 'daily';
    const varsParam = searchParams.get('vars');
    const start = searchParams.get('start') ?? undefined;
    const end = searchParams.get('end') ?? undefined;

    // Validate required parameters
    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat and lon' },
        { status: 400 }
      );
    }

    const lat = Number(latParam);
    const lon = Number(lonParam);

    // Validate coordinates are numbers
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat and lon must be numbers' },
        { status: 400 }
      );
    }

    // Validate coordinates are within AU/NZ bounds
    if (!isValidAU_NZCoords({ lat, lon })) {
      return NextResponse.json(
        {
          error: 'Coordinates must be within Australia or New Zealand bounds',
        },
        { status: 400 }
      );
    }

    // Parse variables
    const vars = varsParam?.split(',').filter(Boolean);

    // Build Open-Meteo API URL
    const url = buildUrl({ lat, lon }, gran, { vars, start, end });

    // Fetch with retry logic
    const res = await fetchWithRetry(url);

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }

    const data = await res.json();

    // Validate response with Zod schema
    const parsed =
      gran === 'hourly' ? ZHourly.safeParse(data) : ZDaily.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid schema', details: parsed.error.errors },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    // Handle fetch errors after all retries
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data', message: error.message },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
