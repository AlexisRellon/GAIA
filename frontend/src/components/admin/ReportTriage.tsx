/**
 * Report Triage Component (AC-04)
 * 
 * Features:
 * - View unverified citizen reports with confidence scores
 * - Filters: status, hazard_type, min/max confidence
 * - Approve or reject reports with notes
 * - Preview report location (coordinates display)
 * 
 * Module: AC-04 (Unverified Report Triage)
 * Permissions: All admin roles (Master Admin, Validator, LGU Responder)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Shield, CheckCircle, XCircle, MapPin, AlertCircle, Image as ImageIcon, User, Phone, Clock, Copy } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import { HazardIcon, getHazardIcon } from '../../constants/hazard-icons';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TableSkeleton } from '../dashboard/AnalyticsSkeleton';
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
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

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
  image_url?: string | null; // Backend may return this as well
  name?: string | null; // Reporter's name
  contact_number?: string | null; // Reporter's contact number
  infrastructure_types?: string[] | null;
  infrastructure_other_text?: string | null;
  infrastructure_details?: string | null;
  debris_status?: string | null;
  damage_severity?: string | null;
  crisis_categories?: Record<string, string[]> | null;
  image_metadata?: {
    ai_processing?: {
      ai_hazard_type?: string | null;
      ai_confidence?: number;
      coordinates_source?: string | null;
      ai_processing_timestamp?: string;
    };
  } | null;
}

const columnHelper = createColumnHelper<TriageReport>();

const PH_BOUNDS = {
  minLat: 4,
  maxLat: 21,
  minLng: 116,
  maxLng: 127,
};

const EXCLUSION_ZONES = [
  {
    name: 'Sabah/Sarawak (Malaysia)',
    latRange: [3.5, 7.5],
    lngRange: [113.5, 118.5],
  },
  {
    name: 'Brunei',
    latRange: [4.0, 5.5],
    lngRange: [114.0, 115.5],
  },
];

const DEFAULT_CENTER: [number, number] = [12.8797, 121.774];
const DEFAULT_ZOOM = 6;
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [PH_BOUNDS.minLat, PH_BOUNDS.minLng],
  [PH_BOUNDS.maxLat, PH_BOUNDS.maxLng],
];
const COORD_TOLERANCE = 0.00001;

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STATUS_META: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  unverified: {
    label: 'Unverified',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: XCircle,
  },
  duplicate: {
    label: 'Duplicate',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Copy,
  },
};

const getStatusMeta = (status?: string | null) => {
  const key = (status || 'unverified').toLowerCase();
  return STATUS_META[key] ?? {
    label: status || 'Unknown',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: AlertCircle,
  };
};

const isWithinPhilippines = (lat: number, lng: number) => {
  const withinBoundingBox =
    lat >= PH_BOUNDS.minLat &&
    lat <= PH_BOUNDS.maxLat &&
    lng >= PH_BOUNDS.minLng &&
    lng <= PH_BOUNDS.maxLng;

  if (!withinBoundingBox) {
    return false;
  }

  // Exclude known nearby countries that overlap the bounding box (e.g., Malaysia, Brunei)
  const insideExclusion = EXCLUSION_ZONES.some(({ latRange, lngRange }) => {
    return lat >= latRange[0] && lat <= latRange[1] && lng >= lngRange[0] && lng <= lngRange[1];
  });

  return !insideExclusion;
};

const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click(event) {
      onLocationSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

const MapAutoResize: React.FC = () => {
  const map = useMapEvents({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timeout);
  }, [map]);

  return null;
};

// Component for displaying report photos with error handling
const ReportPhoto: React.FC<{ imageUrl: string; index: number }> = ({ imageUrl, index }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Image failed to load</p>
        <a 
          href={imageUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline mt-1 block"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <>
      <img
        src={imageUrl}
        alt={`Hazard photo ${index + 1}`}
        className="max-h-32 w-full object-contain sm:max-h-36"
        onError={() => setImageError(true)}
      />
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70 transition-opacity"
      >
        Open Full Size
      </a>
    </>
  );
};

const ReportTriage: React.FC = () => {
  // Filter state
  const [statusFilter, setStatusFilter] = useState('unverified');
  const [hazardTypeFilter, setHazardTypeFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState<number | undefined>(undefined);
  const [maxConfidence, setMaxConfidence] = useState<number | undefined>(undefined);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submitted_at', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Dialog state
  const [selectedReport, setSelectedReport] = useState<TriageReport | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'validate' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedCoordinates, setEditedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch reports with React Query
  const { 
    data: rawReports, 
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

  const reports = useMemo(() => rawReports ?? [], [rawReports]);
  const error = queryError ? (queryError as Error).message : null;

  useEffect(() => {
    if (
      selectedReport &&
      selectedReport.latitude !== null &&
      selectedReport.latitude !== undefined &&
      selectedReport.longitude !== null &&
      selectedReport.longitude !== undefined
    ) {
      setEditedCoordinates({
        lat: selectedReport.latitude,
        lng: selectedReport.longitude,
      });
    } else {
      setEditedCoordinates(null);
    }
    setCoordinateError(null);
  }, [selectedReport]);

  const handleCoordinateChange = useCallback(
    (lat: number, lng: number, marker?: L.Marker) => {
      if (!isWithinPhilippines(lat, lng)) {
        setCoordinateError('Pins can only be placed within the Philippines (4°-21°N, 116°-127°E).');

        if (marker) {
          const fallback = editedCoordinates ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
          marker.setLatLng([fallback.lat, fallback.lng]);
        }

        return;
      }

      setCoordinateError(null);
      setEditedCoordinates({ lat, lng });
    },
    [editedCoordinates]
  );

  const resetToReportedCoordinates = useCallback(() => {
    if (
      selectedReport &&
      selectedReport.latitude !== null &&
      selectedReport.latitude !== undefined &&
      selectedReport.longitude !== null &&
      selectedReport.longitude !== undefined
    ) {
      setEditedCoordinates({ lat: selectedReport.latitude, lng: selectedReport.longitude });
      setCoordinateError(null);
    } else {
      setEditedCoordinates(null);
    }
  }, [selectedReport]);

  const coordinatesChanged = useMemo(() => {
    if (!selectedReport || !editedCoordinates) {
      return false;
    }

    const originalLat = selectedReport.latitude;
    const originalLng = selectedReport.longitude;

    if (originalLat === null || originalLat === undefined || originalLng === null || originalLng === undefined) {
      return true;
    }

    return (
      Math.abs(originalLat - editedCoordinates.lat) > COORD_TOLERANCE ||
      Math.abs(originalLng - editedCoordinates.lng) > COORD_TOLERANCE
    );
  }, [selectedReport, editedCoordinates]);

  const hasOriginalCoordinates = Boolean(
    selectedReport &&
    selectedReport.latitude !== null &&
    selectedReport.latitude !== undefined &&
    selectedReport.longitude !== null &&
    selectedReport.longitude !== undefined
  );

  const mapCenter: [number, number] = editedCoordinates
    ? [editedCoordinates.lat, editedCoordinates.lng]
    : DEFAULT_CENTER;
  const mapZoom = editedCoordinates ? 13 : DEFAULT_ZOOM;
  const isClient = typeof window !== 'undefined';

  const columns = [
    columnHelper.accessor('tracking_id', {
      header: 'ID',
      cell: (info) => {
        const id = info.getValue();
        return (
          <span className="font-mono text-[11px] font-medium block truncate" title={id}>
            {id}
          </span>
        );
      },
    }),
    columnHelper.accessor('hazard_type', {
      header: 'Hazard',
      cell: (info) => {
        const hazardType = info.getValue() || 'other';
        const config = getHazardIcon(hazardType);
        return (
          <Badge 
            variant="secondary" 
            className="capitalize inline-flex items-center gap-1 max-w-full truncate px-1.5 py-0 text-[11px] font-normal"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            <HazardIcon hazardType={hazardType} size={12} useHazardColor className="shrink-0" />
            <span className="truncate">{config.label || 'Unclassified'}</span>
          </Badge>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const meta = getStatusMeta(info.getValue());
        const Icon = meta.icon;
        return (
          <Badge variant="outline" className={`inline-flex w-fit max-w-full items-center gap-1 border px-1.5 py-0 text-[11px] ${meta.className}`}>
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{meta.label}</span>
          </Badge>
        );
      },
    }),
    columnHelper.accessor('location_name', {
      header: 'Location',
      cell: (info) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-medium break-words leading-snug">{info.getValue() || 'Unknown'}</span>
          {info.row.original.latitude !== null &&
            info.row.original.latitude !== undefined &&
            info.row.original.longitude !== null &&
            info.row.original.longitude !== undefined && (
            <span className="text-[10px] leading-tight text-muted-foreground font-mono">
              {info.row.original.latitude.toFixed(4)}
              ,{info.row.original.longitude.toFixed(4)}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Details',
      cell: (info) => (
        <div className="min-w-0 overflow-hidden">
          <span className="block text-xs line-clamp-2 break-words leading-snug">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('confidence_score', {
      header: 'Conf.',
      cell: (info) => {
        const score = info.getValue();
        if (score === null) return <span className="text-muted-foreground text-xs">-</span>;

        const percentage = Math.round(score * 100);
        const variant = percentage >= 70 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive';

        return (
          <Badge variant={variant} className="px-1.5 py-0 text-[11px] tabular-nums">
            {percentage}%
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'photo',
      header: 'Img',
      cell: ({ row }) => {
        const report = row.original;
        // Handle both image_urls (array) and image_url (string) formats
        const imageUrls = report.image_urls || (report.image_url ? [report.image_url] : []);
        const hasPhoto = imageUrls.length > 0 && imageUrls[0] && imageUrls[0] !== null;

        if (!hasPhoto) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }

        return (
          <div className="flex items-center justify-center gap-0.5 text-blue-600" title={`${imageUrls.length} photo(s)`}>
            <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-[11px] font-medium tabular-nums">{imageUrls.length}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('submitted_at', {
      header: 'Submitted',
      cell: (info) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
          {format(new Date(info.getValue()), 'MMM d HH:mm')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const report = row.original;
        const isProcessed = (report.status && report.status.toLowerCase() !== 'unverified') || report.validated;

        if (isProcessed) {
          return (
            <div className="flex w-full min-w-0 justify-end">
              <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">Done</span>
            </div>
          );
        }

        return (
          <div className="flex w-full min-w-0 items-center justify-end gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAction(report, 'validate')}
              className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              aria-label={`Approve report ${report.tracking_id}`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAction(report, 'reject')}
              className="h-7 w-7 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Reject report ${report.tracking_id}`}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
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
    setRejectionReason('');
    setIsActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedReport || !actionType) {
      // eslint-disable-next-line no-console
      console.log('[ReportTriage] No selected report or action type');
      return;
    }

    if (actionType === 'validate' && coordinateError) {
      toast.warning('Please resolve the coordinate error before validating.');
      return;
    }

    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejecting this report.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[ReportTriage] Starting ${actionType} for report:`, selectedReport.tracking_id);
    setIsProcessing(true);
    
    try {
      // Call backend validate/reject endpoint
      // eslint-disable-next-line no-console
      console.log(`[ReportTriage] Calling adminApi.reports.${actionType}...`);
      
      if (actionType === 'validate') {
        const payload: { latitude?: number; longitude?: number } = {};
        
        if (editedCoordinates && coordinatesChanged) {
          payload.latitude = Number(editedCoordinates.lat.toFixed(6));
          payload.longitude = Number(editedCoordinates.lng.toFixed(6));
        }
        
        const result = await adminApi.reports.validate(
          selectedReport.tracking_id,
          Object.keys(payload).length ? payload : undefined
        );
        // eslint-disable-next-line no-console
        console.log('[ReportTriage] Validate result:', result);
      } else {
        const result = await adminApi.reports.reject(selectedReport.tracking_id, {
          reason: rejectionReason.trim(),
        });
        // eslint-disable-next-line no-console
        console.log('[ReportTriage] Reject result:', result);
      }
      
      // eslint-disable-next-line no-console
      console.log('[ReportTriage] Refetching reports...');
      await refetch();
      
      const trackingId = selectedReport.tracking_id;
      setIsActionDialogOpen(false);
      setSelectedReport(null);
      setActionType(null);

      if (actionType === 'validate') {
        toast.success(`Report ${trackingId} approved`, {
          description: 'The report has been approved and added to the hazard map.',
        });
      } else {
        toast.success(`Report ${trackingId} rejected`, {
          description: 'The report has been rejected and will not appear on the map.',
        });
      }
    } catch (err) {
      console.error(`[ReportTriage] Error ${actionType} report:`, err);
      toast.error(`Failed to ${actionType} report`, {
        description: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
      });
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
          {statusFilter === 'unverified'
            ? 'Approve or reject unverified citizen reports (AC-04)'
            : `Browsing ${getStatusMeta(statusFilter).label.toLowerCase()} citizen reports (read-only)`}
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

        {/* Table — fixed layout + compact cells keep rows within typical dashboard widths */}
        <div className="border rounded-md">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '31%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%', minWidth: 88 }} />
            </colgroup>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'h-9 px-2 py-1.5 text-xs font-semibold',
                        header.column.id === 'actions' && 'text-right'
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            header.column.getCanSort() && 'cursor-pointer select-none',
                            header.column.id === 'actions' && 'flex w-full min-w-0 justify-end'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() ? (
                            <span className="ml-0.5">{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
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
                  <TableCell colSpan={columns.length} className="p-0">
                    <TableSkeleton rows={6} columns={columns.length} />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground text-sm">
                    {statusFilter === 'duplicate'
                      ? 'No duplicate reports. Citizen reports are not currently flagged as duplicates by the system.'
                      : `No ${getStatusMeta(statusFilter).label.toLowerCase()} reports match the current filters.`}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'min-w-0 px-2 py-1.5 text-xs',
                          cell.column.id === 'actions' ? 'align-middle' : 'align-top'
                        )}
                      >
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
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {reports.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
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
          <DialogContent
            className={cn(
              'min-h-0 gap-2 overflow-x-hidden overflow-y-auto p-3 sm:max-w-2xl sm:gap-2 sm:p-4',
              /* Hide scrollbar track while keeping wheel/touch scroll for tall content */
              '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
            )}
          >
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base">
                {actionType === 'validate' ? 'Approve Report' : 'Reject Report'}
              </DialogTitle>
              <DialogDescription className="text-xs leading-snug">
                {actionType === 'validate'
                  ? 'Approve this report as verified and add it to the hazard map.'
                  : 'Reject this report and mark it as invalid.'}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-muted-foreground">Tracking</span>
                    <span className="font-mono text-xs sm:text-sm">{selectedReport.tracking_id}</span>
                    <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                      ·
                    </span>
                    <Badge
                      variant="secondary"
                      className="flex shrink-0 items-center gap-1 text-xs"
                      style={{
                        backgroundColor: getHazardIcon(selectedReport.hazard_type || 'other').bgColor,
                        color: getHazardIcon(selectedReport.hazard_type || 'other').color,
                      }}
                    >
                      <HazardIcon hazardType={selectedReport.hazard_type || 'other'} size={12} useHazardColor />
                      {getHazardIcon(selectedReport.hazard_type || 'other').label || 'Unclassified'}
                    </Badge>
                  </div>
                  {(selectedReport.name || selectedReport.contact_number) && (
                    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted p-2 text-foreground">
                      <span className="text-xs font-medium">Reporter information</span>
                      {selectedReport.name?.trim() && (
                        <div className="flex min-w-0 items-start gap-1.5">
                          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          {/^ENC:/i.test(selectedReport.name.trim()) || selectedReport.name.length > 100 ? (
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-[11px] leading-tight text-muted-foreground">
                                Encrypted at rest — scroll to review.
                              </p>
                              <p className="max-h-12 overflow-y-auto break-all rounded border border-border bg-background p-1.5 text-[11px] font-mono leading-snug [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {selectedReport.name}
                              </p>
                            </div>
                          ) : (
                            <span className="min-w-0 flex-1 break-words text-xs">{selectedReport.name}</span>
                          )}
                        </div>
                      )}
                      {selectedReport.contact_number?.trim() && (
                        <div className="flex min-w-0 items-start gap-1.5">
                          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          {/^ENC:/i.test(selectedReport.contact_number.trim()) ||
                          selectedReport.contact_number.length > 100 ? (
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-[11px] leading-tight text-muted-foreground">
                                Encrypted at rest — scroll to review.
                              </p>
                              <p className="max-h-12 overflow-y-auto break-all rounded border border-border bg-background p-1.5 text-[11px] font-mono leading-snug [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {selectedReport.contact_number}
                              </p>
                            </div>
                          ) : (
                            <span className="min-w-0 flex-1 break-all font-mono text-xs">
                              {selectedReport.contact_number}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 rounded-md border border-border bg-muted p-2">
                    <span className="text-xs font-medium">Submitted Form Details</span>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type of Infrastructure</span>
                      <p className="text-xs leading-snug text-foreground">
                        {selectedReport.infrastructure_types?.length
                          ? selectedReport.infrastructure_types.join(', ')
                          : 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Infrastructure Details</span>
                      <p className="text-xs leading-snug text-foreground">
                        {selectedReport.infrastructure_details || 'Not provided'}
                      </p>
                      {selectedReport.infrastructure_other_text?.trim() && (
                        <p className="text-xs leading-snug text-foreground">
                          <span className="font-medium">Other:</span> {selectedReport.infrastructure_other_text}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Debris Assessment</span>
                      <p className="text-xs leading-snug text-foreground">
                        {selectedReport.debris_status || 'Not provided'}
                        {selectedReport.damage_severity ? ` · ${selectedReport.damage_severity}` : ''}
                      </p>
                    </div>
                  </div>
                  {selectedReport.latitude !== null &&
                    selectedReport.latitude !== undefined &&
                    selectedReport.longitude !== null &&
                    selectedReport.longitude !== undefined && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-xs">
                          {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                        </span>

                        {selectedReport.image_metadata?.ai_processing?.coordinates_source === 'user' && (
                          <span className="text-[11px] text-muted-foreground">
                            Coordinates provided by user
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {(selectedReport.latitude === null ||
                    selectedReport.latitude === undefined ||
                    selectedReport.longitude === null ||
                    selectedReport.longitude === undefined) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>No coordinates available</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium">Description</span>
                    <p className="line-clamp-4 text-xs leading-snug text-muted-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {/* Photo Display */}
                {(() => {
                  // Handle both image_urls (array) and image_url (string) formats
                  const imageUrls = selectedReport.image_urls || (selectedReport.image_url ? [selectedReport.image_url] : []);
                  const validImageUrls = imageUrls.filter(url => url && url !== null && url !== '');

                  if (validImageUrls.length === 0) {
                    return (
                      <div className="rounded border border-border bg-muted px-2 py-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>No photo provided</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs font-medium">Photo Evidence ({validImageUrls.length})</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {validImageUrls.map((imageUrl, index) => (
                          <div key={index} className="relative overflow-hidden rounded-lg border border-border bg-muted">
                            <ReportPhoto imageUrl={imageUrl} index={index} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {actionType === 'validate' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">Adjust location on map</p>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          Drag the pin or click on the map to correct inaccurate coordinates before validation.
                        </p>
                      </div>
                      {hasOriginalCoordinates && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 text-xs"
                          onClick={resetToReportedCoordinates}
                        >
                          Reset to reported pin
                        </Button>
                      )}
                    </div>

                    {isClient ? (
                      <div className="overflow-hidden rounded-lg border" style={{ height: 220 }}>
                        <MapContainer
                          key={selectedReport.tracking_id}
                          center={mapCenter}
                          zoom={mapZoom}
                          minZoom={5}
                          maxZoom={16}
                          scrollWheelZoom
                          style={{ height: '100%', width: '100%' }}
                          maxBounds={MAP_BOUNDS}
                          maxBoundsViscosity={0.9}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapAutoResize />
                  <MapClickHandler onLocationSelect={(lat, lng) => handleCoordinateChange(lat, lng)} />
                          {editedCoordinates && (
                            <Marker
                              position={[editedCoordinates.lat, editedCoordinates.lng]}
                              icon={markerIcon}
                              draggable
                              eventHandlers={{
                        dragend: (event) => {
                          const marker = event.target as L.Marker;
                                  const markerPosition = marker.getLatLng();
                          handleCoordinateChange(markerPosition.lat, markerPosition.lng, marker);
                                },
                              }}
                            />
                          )}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="rounded-lg border p-2 text-xs text-muted-foreground">
                        Map preview unavailable in this environment.
                      </div>
                    )}

                    {coordinateError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <AlertDescription className="text-xs">{coordinateError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {editedCoordinates ? (
                        <>
                          <span className="font-medium text-foreground">
                            {editedCoordinates.lat.toFixed(5)}, {editedCoordinates.lng.toFixed(5)}
                          </span>
                          {coordinatesChanged && (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                              Updated pin will be saved
                            </Badge>
                          )}
                          {!coordinatesChanged && (
                            <span>The pin matches the reported coordinates.</span>
                          )}
                        </>
                      ) : (
                        <span>Click anywhere in the Philippines to drop a pin.</span>
                      )}
                    </div>
                  </div>
                )}

                {actionType === 'reject' && (
                  <div className="space-y-1.5">
                    <label htmlFor="rejection-reason" className="text-xs font-medium">
                      Reason for rejection <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this report is being rejected..."
                      maxLength={500}
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">
                      {rejectionReason.length}/500
                    </p>
                  </div>
                )}

                <div
                  role="alert"
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-2 py-1.5 text-[11px] leading-snug',
                    actionType === 'validate'
                      ? 'border-green-600/80 bg-green-50 dark:border-green-700 dark:bg-green-950/50'
                      : 'border-red-600 bg-red-50 dark:border-red-800 dark:bg-red-950/50'
                  )}
                >
                  <AlertCircle
                    className={cn(
                      'mt-0.5 h-3 w-3 shrink-0',
                      actionType === 'validate'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                    aria-hidden
                  />
                  <p
                    className={cn(
                      'min-w-0 flex-1',
                      actionType === 'validate'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-red-900 dark:text-red-100'
                    )}
                  >
                    {actionType === 'validate'
                      ? 'This action will mark the report as validated and make it visible on the public hazard map.'
                      : 'This action will reject the report and it will not appear on the hazard map.'}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
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
                disabled={isProcessing || (actionType === 'validate' && Boolean(coordinateError)) || (actionType === 'reject' && !rejectionReason.trim())}
                variant={actionType === 'validate' ? 'default' : 'destructive'}
              >
                {isProcessing ? 'Processing...' : actionType === 'validate' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ReportTriage;