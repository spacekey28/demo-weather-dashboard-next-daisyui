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

  // Default role: manager
  const role = (params.role ?? 'manager') as 'manager' | 'analyst';

  return (
    <main className='container mx-auto px-4 py-6'>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Weather Dashboard</h1>
        <div className='rounded-lg bg-base-200 p-4'>
          <h2 className='text-xl font-semibold mb-4'>Parameters</h2>
          <div className='space-y-2 text-sm'>
            <p>
              <strong>Role:</strong> {role}
            </p>
            <p>
              <strong>Cities:</strong> {cities.join(', ')}
            </p>
            <p>
              <strong>Granularity:</strong> {gran}
            </p>
            <p>
              <strong>Variables:</strong> {vars.join(', ')}
            </p>
            <p>
              <strong>Start:</strong> {start}
            </p>
            <p>
              <strong>End:</strong> {end}
            </p>
          </div>
        </div>
        {/* RoleToggle + FilterBar placeholder */}
        {/* Manager: <KpiCards data={results} /> */}
        {/* Analyst: <Charts data={results} /> */}
      </div>
    </main>
  );
}
