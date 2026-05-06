<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CollectionReport;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function collectionReportsCsv(Request $request): StreamedResponse
    {
        $query = CollectionReport::with(['routePlan.zone.barangays', 'routePlan.collector'])
            ->orderByDesc('report_date');

        if ($request->filled('date_from')) {
            $query->whereDate('report_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('report_date', '<=', $request->date_to);
        }
        if ($request->filled('zone_id')) {
            $query->whereHas('routePlan', fn ($q) => $q->where('zone_id', $request->zone_id));
        }
        if ($request->filled('collector_id')) {
            $query->where('collector_user_id', $request->collector_id);
        }

        $reports = $query->get();

        $filename = 'collection-reports-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($reports) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Date', 'Collector', 'Zone', 'Barangay',
                'Mixed Waste (kg)', 'Biodegradable (kg)', 'Recyclable (kg)',
                'Residual (kg)', 'Solid Waste (kg)', 'Total (kg)', 'Notes',
            ]);

            $totals = ['mixed' => 0, 'bio' => 0, 'recyclable' => 0, 'residual' => 0, 'solid' => 0, 'total' => 0];

            foreach ($reports as $r) {
                $total = $r->mixed_waste + $r->biodegradable + $r->recyclable + $r->residual + $r->solid_waste;
                $totals['mixed'] += $r->mixed_waste;
                $totals['bio'] += $r->biodegradable;
                $totals['recyclable'] += $r->recyclable;
                $totals['residual'] += $r->residual;
                $totals['solid'] += $r->solid_waste;
                $totals['total'] += $total;

                fputcsv($handle, [
                    $r->report_date?->toDateString(),
                    $r->routePlan?->collector?->name ?? '—',
                    $r->routePlan?->zone?->name ?? '—',
                    $r->routePlan?->zone?->barangayNames() ?? '—',
                    $r->mixed_waste,
                    $r->biodegradable,
                    $r->recyclable,
                    $r->residual,
                    $r->solid_waste,
                    round($total, 2),
                    $r->notes ?? '',
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, [
                'TOTALS', '', '', '',
                $totals['mixed'], $totals['bio'], $totals['recyclable'],
                $totals['residual'], $totals['solid'], round($totals['total'], 2), '',
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
