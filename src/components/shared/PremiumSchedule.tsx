import { policySchedule, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PremiumSchedule({
  term,
  startDate,
  premium,
  currency = "INR",
}: {
  term?: string;
  startDate?: string;
  premium?: number | string;
  currency?: string;
}) {
  const schedule = policySchedule(term, startDate, premium);
  if (!schedule) return null;
  return (
    <div className="overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.rows.map((r) => (
            <TableRow key={r.label}>
              <TableCell>
                <span className="font-medium">{r.label}</span> · {r.period}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(r.amount, currency)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">{schedule.totalLabel}</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrency(schedule.total, currency)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
