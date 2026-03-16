import { Check, X, Minus } from 'lucide-react';

type FeatureValue = boolean | string;

interface FeatureRow {
  label: string;
  free: FeatureValue;
  pro: FeatureValue;
  business: FeatureValue;
}

interface FeatureCategory {
  category: string;
  rows: FeatureRow[];
}

const featureData: FeatureCategory[] = [
  {
    category: 'Link Management',
    rows: [
      { label: 'Active links', free: '25', pro: '100', business: '175' },
      { label: 'Custom aliases', free: true, pro: true, business: true },
      { label: 'Link redirects', free: true, pro: true, business: true },
    ],
  },
  {
    category: 'Tracking & Analytics',
    rows: [
      { label: 'Click tracking', free: true, pro: true, business: true },
      { label: 'Lead tracking', free: false, pro: true, business: true },
      { label: 'Sale tracking', free: false, pro: true, business: true },
      { label: 'Revenue tracking', free: false, pro: true, business: true },
      { label: 'Real-time analytics', free: false, pro: true, business: true },
      { label: 'Geographic insights', free: false, pro: true, business: true },
      { label: 'EPC & conversion rates', free: false, pro: true, business: true },
      { label: 'Traffic source breakdown', free: false, pro: true, business: true },
    ],
  },
  {
    category: 'Integrations & API',
    rows: [
      { label: 'Platform integrations', free: false, pro: true, business: true },
      { label: 'Postback URL support', free: false, pro: true, business: true },
      { label: 'API access', free: false, pro: false, business: true },
      { label: 'Webhook support', free: false, pro: false, business: true },
    ],
  },
  {
    category: 'Team & Support',
    rows: [
      { label: 'Community support', free: true, pro: true, business: true },
      { label: 'Priority support', free: false, pro: true, business: true },
      { label: 'Dedicated support', free: false, pro: false, business: true },
      { label: 'Team collaboration', free: false, pro: false, business: true },
    ],
  },
];

function CellValue({ value }: { value: FeatureValue }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-semibold text-foreground">{value}</span>;
  }
  if (value) {
    return <Check className="h-4 w-4 text-primary mx-auto" />;
  }
  return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
}

export function FeatureComparisonTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground w-[40%]">
              Features
            </th>
            <th className="text-center py-4 px-3 text-sm font-bold text-foreground w-[20%]">
              Free
            </th>
            <th className="text-center py-4 px-3 text-sm font-bold text-foreground w-[20%]">
              Pro
            </th>
            <th className="text-center py-4 px-3 text-sm font-bold text-primary w-[20%]">
              Business
            </th>
          </tr>
        </thead>
        <tbody>
          {featureData.map((cat) => (
            <>
              <tr key={`cat-${cat.category}`}>
                <td
                  colSpan={4}
                  className="pt-6 pb-2 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60"
                >
                  {cat.category}
                </td>
              </tr>
              {cat.rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">{row.label}</td>
                  <td className="py-3 px-3 text-center">
                    <CellValue value={row.free} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <CellValue value={row.pro} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <CellValue value={row.business} />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
