import { format } from 'date-fns';
import { MousePointer, Users, DollarSign, Percent, Globe, ExternalLink } from 'lucide-react';

interface ReportStats {
  totalClicks: number;
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TopLink {
  alias: string;
  clicks: number;
  revenue: number;
}

interface TopPlacement {
  platform: string;
  placement: string;
  percentage: number;
}

interface TopCountry {
  code: string;
  count: number;
  percentage: number;
}

interface Transaction {
  id: string;
  date: Date;
  type: 'click' | 'lead' | 'sale';
  linkAlias: string;
  amount: number | null;
  placement?: string;
}

interface PerformanceReportProps {
  stats: ReportStats;
  topLinks: TopLink[];
  topPlacements: TopPlacement[];
  topCountries: TopCountry[];
  recentTransactions: Transaction[];
  periodLabel: string;
  currency?: string;
}

// Country data with flags
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', CA: '🇨🇦',
  AU: '🇦🇺', JP: '🇯🇵', BR: '🇧🇷', ES: '🇪🇸', IT: '🇮🇹',
  NL: '🇳🇱', CZ: '🇨🇿', PL: '🇵🇱', SK: '🇸🇰', AT: '🇦🇹',
};

// Platform icons
const PLATFORM_ICONS: Record<string, string> = {
  ig: '📸', tt: '🎵', yt: '▶️', tw: '🐦', fb: '📘',
  ln: '💼', pin: '📌', direct: '🌐',
};

export const PerformanceReport = ({
  stats,
  topLinks,
  topPlacements,
  topCountries,
  recentTransactions,
  periodLabel,
  currency = 'USD',
}: PerformanceReportProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="print-report bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/brand/ghostlink-icon-light.svg" 
              alt="GhostLink" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Performance Report</h1>
              <p className="text-violet-200 text-sm">
                Generated: {format(new Date(), 'MMMM d, yyyy')} • Period: {periodLabel}
              </p>
            </div>
          </div>
          <div className="text-right hidden print:block">
            <p className="text-violet-200 text-xs">ghostlink.lovable.app</p>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="px-8 py-6 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <MousePointer className="w-4 h-4" />
              <span>Total Clicks</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Total Leads</span>
            </div>
            <p className="text-3xl font-bold text-violet-600">{stats.totalLeads.toLocaleString()}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Total Sales</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.totalSales.toLocaleString()}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Revenue</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        
        {/* Conversion Rate Banner */}
        <div className="mt-4 flex items-center gap-2 text-gray-600">
          <Percent className="w-4 h-4" />
          <span className="text-sm">Conversion Rate:</span>
          <span className="font-semibold text-violet-600">{stats.conversionRate.toFixed(1)}%</span>
        </div>
      </section>

      {/* Two Column Layout */}
      <section className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-gray-200">
        {/* Top Performing Links */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-violet-500" />
            Top Performing Links
          </h2>
          <div className="space-y-3">
            {topLinks.slice(0, 5).map((link, index) => (
              <div key={link.alias} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-medium w-5">{index + 1}.</span>
                  <span className="font-medium text-gray-900">{link.alias}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{link.clicks.toLocaleString()} clicks</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(link.revenue)}</span>
                </div>
              </div>
            ))}
            {topLinks.length === 0 && (
              <p className="text-gray-400 text-sm italic">No link data available</p>
            )}
          </div>
        </div>

        {/* Top Sources */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-500" />
            Top Sources (Placements)
          </h2>
          <div className="space-y-3">
            {topPlacements.slice(0, 5).map((placement) => (
              <div key={`${placement.platform}-${placement.placement}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{PLATFORM_ICONS[placement.platform] || '🌐'}</span>
                  <span className="font-medium text-gray-900">{placement.placement}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${placement.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-10 text-right">{placement.percentage}%</span>
                </div>
              </div>
            ))}
            {topPlacements.length === 0 && (
              <p className="text-gray-400 text-sm italic">No placement data available</p>
            )}
          </div>
        </div>
      </section>

      {/* Top Countries */}
      {topCountries.length > 0 && (
        <section className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h2>
          <div className="flex flex-wrap gap-3">
            {topCountries.slice(0, 8).map((country) => (
              <div 
                key={country.code}
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
              >
                <span className="text-lg">{COUNTRY_FLAGS[country.code] || '🌍'}</span>
                <span className="font-medium text-gray-700">{country.code}</span>
                <span className="text-sm text-gray-500">{country.percentage}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="px-8 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-500">Time</th>
              <th className="text-left py-2 font-medium text-gray-500">Type</th>
              <th className="text-left py-2 font-medium text-gray-500">Link</th>
              <th className="text-left py-2 font-medium text-gray-500">Source</th>
              <th className="text-right py-2 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.slice(0, 20).map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-600">{format(tx.date, 'MMM d, HH:mm')}</td>
                <td className="py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    tx.type === 'sale' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : tx.type === 'lead' 
                        ? 'bg-violet-100 text-violet-700' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </span>
                </td>
                <td className="py-2 font-medium text-gray-900">{tx.linkAlias}</td>
                <td className="py-2 text-gray-600">
                  {tx.placement ? (
                    <span className="flex items-center gap-1">
                      <span>{PLATFORM_ICONS[tx.placement.split('-')[0]] || '🌐'}</span>
                      {tx.placement}
                    </span>
                  ) : 'Direct'}
                </td>
                <td className="py-2 text-right font-medium text-gray-900">
                  {tx.amount !== null ? formatCurrency(tx.amount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentTransactions.length === 0 && (
          <p className="text-gray-400 text-sm italic py-4 text-center">No recent activity</p>
        )}
      </section>

      {/* Footer */}
      <footer className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          ghostlink.lovable.app • Powered by <span className="font-semibold text-violet-600">GhostLink</span>
        </p>
      </footer>
    </div>
  );
};
