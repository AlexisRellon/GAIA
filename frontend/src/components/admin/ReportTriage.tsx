/**
 * Report Triage Component (AC-04)
 * 
 * Features:
 * - View unverified citizen reports with confidence scores
 * - Filters: status, hazard_type, min/max confidence
 * - Validate or reject reports with notes
 * - Preview report location (coordinates display)
 * 
 * Module: AC-04 (Unverified Report Triage)
 * Permissions: All admin roles (Master Admin, Validator, LGU Responder)
 */

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, MapPin, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { adminApi } from '../../lib/api';

interface TriageReport {
  id: string;
  tracking_id: string;
  hazard_type: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  confidence_score: number | null;
  status: string;
  validated: boolean;
  submitted_at: string;
  image_urls: string[] | null;
}

const columnHelper = createColumnHelper<TriageReport>();

const ReportTriage: React.FC = () => {
  // Filter state
  const [statusFilter, setStatusFilter] = useState('unverified');
  const [hazardTypeFilter, setHazardTypeFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState<number | undefined>(undefined);
  const [maxConfidence, setMaxConfidence] = useState<number | undefined>(undefined);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submitted_at', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  // Dialog state
  const [selectedReport, setSelectedReport] = useState<TriageReport | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'validate' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch reports with React Query
  const { 
    data: reports = [], 
    isLoading, 
    error: queryError, 
    refetch 
  } = useQuery({
    queryKey: ['admin', 'reports', 'triage', { statusFilter, hazardTypeFilter, minConfidence, maxConfidence }],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        status_filter: statusFilter,
        limit: 100,
      };

      if (hazardTypeFilter !== 'all') {
        params.hazard_type = hazardTypeFilter;
      }

      if (minConfidence !== undefined) {
        params.min_confidence = minConfidence;
      }

      if (maxConfidence !== undefined) {
        params.max_confidence = maxConfidence;
      }

      return await adminApi.reports.triage(params);
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnMount: true, // Refetch when component mounts if data is stale
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const error = queryError ? (queryError as Error).message : null;

  const columns = [
    columnHelper.accessor('tracking_id', {
      header: 'Tracking ID',
      cell: (info) => (
        <span className="font-mono text-sm font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('hazard_type', {
      header: 'Hazard Type',
      cell: (info) => (
        <Badge variant="secondary" className="capitalize">
          {info.getValue() || 'Unclassified'}
        </Badge>
      ),
    }),
    columnHelper.accessor('location_name', {
      header: 'Location',
      cell: (info) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-sm font-medium truncate">{info.getValue() || 'Unknown'}</span>
          {info.row.original.latitude && info.row.original.longitude && (
            <span className="text-xs text-muted-foreground font-mono">
              {info.row.original.latitude.toFixed(4)}, {info.row.original.longitude.toFixed(4)}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => (
        <span className="text-sm line-clamp-2 max-w-md">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('confidence_score', {
      header: 'Confidence',
      cell: (info) => {
        const score = info.getValue();
        if (score === null) return <span className="text-muted-foreground">-</span>;

        const percentage = Math.round(score * 100);
        const variant = percentage >= 70 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive';

        return (
          <Badge variant={variant}>
            {percentage}%
          </Badge>
        );
      },
    }),
    columnHelper.accessor('submitted_at', {
      header: 'Submitted',
      cell: (info) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(info.getValue()), 'MMM dd, HH:mm')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(row.original, 'validate')}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Validate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(row.original, 'reject')}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: reports,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  // Handle validate/reject action
  const handleAction = (report: TriageReport, action: 'validate' | 'reject') => {
    setSelectedReport(report);
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedReport || !actionType) {
      console.log('[ReportTriage] No selected report or action type');
      return;
    }

    console.log(`[ReportTriage] Starting ${actionType} for report:`, selectedReport.tracking_id);
    setIsProcessing(true);

    try {
      // Call backend validate/reject endpoint
      console.log(`[ReportTriage] Calling adminApi.reports.${actionType}...`);
      
      if (actionType === 'validate') {
        const result = await adminApi.reports.validate(selectedReport.tracking_id);
        console.log('[ReportTriage] Validate result:', result);
      } else {
        const result = await adminApi.reports.reject(selectedReport.tracking_id);
        console.log('[ReportTriage] Reject result:', result);
      }

      console.log('[ReportTriage] Refetching reports...');
      // Refresh reports using React Query refetch
      await refetch();

      console.log('[ReportTriage] Closing dialog');
      setIsActionDialogOpen(false);
      setSelectedReport(null);
      setActionType(null);
    } catch (err) {
      console.error(`[ReportTriage] Error ${actionType} report:`, err);
      // Show error toast (could add toast notification here)
      alert(`Failed to ${actionType} report: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Report Triage
        </CardTitle>
        <CardDescription>
          Validate or reject unverified citizen reports (AC-04)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
              </SelectContent>
            </Select>

            {/* Hazard Type Filter */}
            <Select value={hazardTypeFilter} onValueChange={setHazardTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Hazard type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hazards</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
                <SelectItem value="typhoon">Typhoon</SelectItem>
                <SelectItem value="earthquake">Earthquake</SelectItem>
                <SelectItem value="fire">Fire</SelectItem>
                <SelectItem value="landslide">Landslide</SelectItem>
              </SelectContent>
            </Select>

            {/* Min Confidence */}
            <Select
              value={minConfidence?.toString() || 'none'}
              onValueChange={(value) => setMinConfidence(value === 'none' ? undefined : parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Min confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No minimum</SelectItem>
                <SelectItem value="0.3">30%+</SelectItem>
                <SelectItem value="0.5">50%+</SelectItem>
                <SelectItem value="0.7">70%+</SelectItem>
              </SelectContent>
            </Select>

            {/* Max Confidence */}
            <Select
              value={maxConfidence?.toString() || 'none'}
              onValueChange={(value) => setMaxConfidence(value === 'none' ? undefined : parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Max confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No maximum</SelectItem>
                <SelectItem value="0.5">50%-</SelectItem>
                <SelectItem value="0.7">70%-</SelectItem>
                <SelectItem value="0.9">90%-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() ? (
                            <span className="ml-1">{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                          ) : null}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    Loading reports...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    No reports found for triage
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, reports.length)} of{' '}
            {reports.length} reports
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Action Confirmation Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'validate' ? 'Validate Report' : 'Reject Report'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'validate'
                  ? 'Confirm this report as verified and add it to the hazard map.'
                  : 'Reject this report and mark it as invalid.'}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tracking ID:</span>
                    <span className="font-mono text-sm">{selectedReport.tracking_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Hazard Type:</span>
                    <Badge variant="secondary">{selectedReport.hazard_type || 'Unclassified'}</Badge>
                  </div>
                  {selectedReport.latitude && selectedReport.longitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">
                        {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                  </div>
                </div>

                <Alert className={actionType === 'validate' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  <AlertCircle className={actionType === 'validate' ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-red-600'} />
                  <AlertDescription className={actionType === 'validate' ? 'text-green-800' : 'text-red-800'}>
                    {actionType === 'validate'
                      ? 'This action will mark the report as validated and make it visible on the public hazard map.'
                      : 'This action will reject the report and it will not appear on the hazard map.'}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActionDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmAction}
                disabled={isProcessing}
                variant={actionType === 'validate' ? 'default' : 'destructive'}
              >
                {isProcessing ? 'Processing...' : actionType === 'validate' ? 'Confirm Validation' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ReportTriage;
