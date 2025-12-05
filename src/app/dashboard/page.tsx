import { getLocationById } from '@/lib/locations';
import type { DailyResp, HourlyResp } from '@/lib/schema';

/**
 * Calculate default date range (upcoming 7 days)
 */
function getDefaultDateRange(): { start: string; end: string } {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    start: formatDate(today),
    end: formatDate(endDate),
  };
}

/**
 * Get default variables based on granularity
 */
function getDefaultVariables(granularity: 'hourly' | 'daily'): string[] {
  if (granularity === 'hourly') {
    return ['temperature_2m', 'precipitation', 'windspeed_10m'];
  }
  return ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'];
}

/**
 * Validate date range (max 30 days)
 */
function validateDateRange(
  start: string,
  end: string
): {
  isValid: boolean;
  error?: string;
} {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (startDate > endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return {
      isValid: false,
      error: `Date range exceeds maximum of 30 days (${diffDays} days)`,
    };
  }

  return { isValid: true };
}

/**
 * Get base URL for API calls
 */
function getBaseUrl(): string {
  // In production, use environment variable or construct from headers
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // For development, use localhost
  return process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:3000';
}

interface CityWeatherData {
  id: string;
  label: string;
  data: HourlyResp | DailyResp;
}

/**
 * Fetch weather data for a single city
 */
async function fetchCityWeather(
  cityId: string,
  gran: 'hourly' | 'daily',
  vars: string[],
  start: string,
  end: string
): Promise<CityWeatherData | null> {
  const location = getLocationById(cityId);
  if (!location) {
    return null;
  }

  const qs = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    gran,
    vars: vars.join(','),
    start,
    end,
  });

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/weather?${qs.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to fetch weather for ${cityId}: ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    return {
      id: cityId,
      label: location.label,
      data: data as HourlyResp | DailyResp,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching weather for ${cityId}:`, error);
    return null;
  }
}

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard page - Server Component
 * Displays weather data for selected cities
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // Extract searchParams from page props
  const params = await searchParams;

  // Parse URL parameters with defaults
  // Default city: Auckland
  const cityParam = params.city ?? 'auckland';
  const cities = String(cityParam).split(',');

  // Default granularity: hourly
  const gran = (params.gran ?? 'hourly') as 'hourly' | 'daily';

  // Default variables based on granularity
  const varsParam = params.vars;
  const vars = varsParam
    ? String(varsParam).split(',').filter(Boolean)
    : getDefaultVariables(gran);

  // Default date range: upcoming 7 days
  const defaultDateRange = getDefaultDateRange();
  const start = (params.start as string | undefined) ?? defaultDateRange.start;
  const end = (params.end as string | undefined) ?? defaultDateRange.end;

  // Validate date range (max 30 days)
  const dateValidation = validateDateRange(start, end);
  if (!dateValidation.isValid) {
    return (
      <main className='container mx-auto px-4 py-6'>
        <div className='rounded-lg bg-error p-4 text-error-content'>
          <h2 className='text-xl font-semibold mb-2'>Date Range Error</h2>
          <p>{dateValidation.error}</p>
        </div>
      </main>
    );
  }

  // Default role: manager
  const role = (params.role ?? 'manager') as 'manager' | 'analyst';

  // Fetch weather data for all selected cities using Promise.all
  const weatherDataPromises = cities.map((cityId) =>
    fetchCityWeather(cityId, gran, vars, start, end)
  );

  const weatherDataResults = await Promise.all(weatherDataPromises);

  // Filter out null results (invalid cities or failed fetches)
  const weatherData: CityWeatherData[] = weatherDataResults.filter(
    (result): result is CityWeatherData => result !== null
  );

  return (
    <main className='container mx-auto px-4 py-6 max-w-7xl'>
      <div className='space-y-6'>
        {/* Header Section */}
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold'>Weather Dashboard</h1>
          <p className='text-base-content/70'>
            Monitor weather conditions across Australia and New Zealand
          </p>
        </header>

        {/* Controls Section - Placeholder for RoleToggle and FilterBar */}
        <section className='rounded-lg bg-base-200 p-4'>
          <h2 className='text-lg font-semibold mb-4'>Controls</h2>
          {/* TODO: Add RoleToggle component
           * Component: src/components/RoleToggle.tsx
           * Props: { role: 'manager' | 'analyst', onRoleChange: (role) => void }
           * Purpose: Allow switching between manager and analyst views
           */}
          {/* TODO: Add FilterBar component
           * Component: src/components/FilterBar.tsx
           * Props: {
           *   cities: string[],
           *   gran: 'hourly' | 'daily',
           *   vars: string[],
           *   start: string,
           *   end: string,
           *   onFilterChange: (filters) => void
           * }
           * Purpose: Allow users to filter cities, granularity, variables, and date range
           */}
          <div className='text-sm text-base-content/70 italic'>
            RoleToggle and FilterBar components will be added here
          </div>
        </section>

        {/* Parameters Display Section (for debugging) */}
        <section className='rounded-lg bg-base-200 p-4'>
          <h2 className='text-lg font-semibold mb-4'>Current Parameters</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
            <div>
              <strong>Role:</strong> {role}
            </div>
            <div>
              <strong>Cities:</strong> {cities.join(', ')} ({weatherData.length}{' '}
              fetched)
            </div>
            <div>
              <strong>Granularity:</strong> {gran}
            </div>
            <div>
              <strong>Variables:</strong> {vars.join(', ')}
            </div>
            <div>
              <strong>Start:</strong> {start}
            </div>
            <div>
              <strong>End:</strong> {end}
            </div>
          </div>
        </section>

        {/* Weather Data Display Section */}
        {weatherData.length === 0 ? (
          <section className='rounded-lg bg-warning p-6 text-warning-content'>
            <h2 className='text-lg font-semibold mb-2'>No Data Available</h2>
            <p>No weather data available for the selected cities.</p>
          </section>
        ) : (
          <section className='space-y-6'>
            {/* Manager View - KPI Cards */}
            {role === 'manager' && (
              <div className='rounded-lg bg-base-200 p-4'>
                <h2 className='text-lg font-semibold mb-4'>Manager View</h2>
                {/* TODO: Add KpiCards component
                 * Component: src/components/KpiCards.tsx
                 * Props: { data: CityWeatherData[] }
                 * Purpose: Display KPI cards with average temperature, total precipitation, max wind speed
                 * Features:
                 *   - Single city: Show KPIs for that city
                 *   - Multiple cities: Show side-by-side comparison
                 *   - Alert badges for threshold violations
                 */}
                <div className='text-sm text-base-content/70 italic'>
                  KpiCards component will be added here
                </div>
              </div>
            )}

            {/* Analyst View - Charts */}
            {role === 'analyst' && (
              <div className='rounded-lg bg-base-200 p-4'>
                <h2 className='text-lg font-semibold mb-4'>Analyst View</h2>
                {/* TODO: Add Charts components
                 * Components: src/components/charts/*.tsx
                 * Props: { data: CityWeatherData[], vars: string[] }
                 * Purpose: Display interactive charts for each variable
                 * Features:
                 *   - Line charts for temperature, precipitation, wind speed
                 *   - One chart per variable
                 *   - Multiple cities overlaid on same chart
                 *   - Chart animations on load and update
                 */}
                <div className='text-sm text-base-content/70 italic'>
                  Charts components will be added here
                </div>
              </div>
            )}

            {/* Debug: Weather Data Summary */}
            <div className='rounded-lg bg-base-200 p-4'>
              <h2 className='text-lg font-semibold mb-4'>
                Weather Data Summary
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {weatherData.map((cityData) => (
                  <div
                    key={cityData.id}
                    className='rounded bg-base-100 p-4 shadow-sm'
                  >
                    <h3 className='font-semibold mb-2'>{cityData.label}</h3>
                    <p className='text-sm text-base-content/70'>
                      Data points:{' '}
                      {gran === 'hourly'
                        ? (cityData.data as HourlyResp).hourly.time.length
                        : (cityData.data as DailyResp).daily.time.length}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
