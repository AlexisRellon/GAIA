/**
 * Citizen Report Form (CR-01, CR-06) — UNDP Redesign
 * 
 * Multi-step wizard for UNDP-mandated damage assessment submission.
 * 3 steps: Incident Details → Infrastructure & Damage → Location & Contact
 *
 * Features:
 * - Step-by-step wizard with progress bar
 * - UNDP mandatory fields: infrastructure type, crisis nature, debris, severity
 * - Categorised multi-select chip UI (touch-friendly)
 * - Mandatory image upload for damage assessment
 * - Form validation with Zod schema per step
 * - Character limits and field sanitization
 * - Image upload component integration
 * - Required map location picker (pin on map or use GPS)
 * - Cloudflare Turnstile integration (temporarily disabled)
 * - Honeypot field for spam prevention
 * - Mobile responsive design
 * - Accessibility support (keyboard navigation, screen readers)
 */

import React, { useState, useCallback, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle, Send, Image as ImageIcon, ArrowLeft, WifiOff, ChevronRight, ChevronLeft, Check,
  // Infrastructure icons
  Home, Building2, Landmark, Zap, Route, School, Trees, ClipboardList,
  // Supplementary crisis icons (tech/human-made only; natural hazards use HazardType)
  Factory, Bomb, FlaskConical, ShieldAlert, Swords, Megaphone,
  // Debris & severity icons
  AlertTriangle, CheckCircle2, HelpCircle, XOctagon, AlertOctagon, MinusCircle,
  type LucideIcon,
} from 'lucide-react';
import { ALL_HAZARD_TYPES } from '../hooks/useHazardFilters';
import { HAZARD_ICON_REGISTRY, HazardIcon } from '../constants/hazard-icons';
import ImageUpload from '../components/reports/ImageUpload';
import { API_BASE_URL } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { isValidPhilippinePhoneNumber } from '../utils/phoneValidation';
import { z } from 'zod';
// PWA-01: Offline queue + online status
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { enqueueReport, fileToDataUrl } from '../lib/offlineQueue';
import { requestBackgroundSync } from '../serviceWorkerRegistration';
import { toast } from 'sonner';
import {
  INFRASTRUCTURE_TYPES,
  INFRASTRUCTURE_TYPE_CONFIG,
  CRISIS_CATEGORIES,
  DEBRIS_OPTIONS,
  DAMAGE_SEVERITY_LEVELS,
  DAMAGE_SEVERITY_CONFIG,
  type InfrastructureType,
  type UNDPFormData,
  type CrisisCategoryKey,
} from '../types/undpTypes';

// LocationPicker wraps Leaflet (~150KB+). Lazy-load it so it's excluded from
// the initial CitizenReportForm chunk and only fetched when the form renders.
const LocationPicker = React.lazy(() => import('../components/reports/LocationPicker'));

/** Must match backend SUBMISSION_COOLDOWN_SECONDS. Cooldown starts on successful submit. */
const SUBMISSION_COOLDOWN_SECONDS = 300;
const COOLDOWN_STORAGE_KEY = 'citizen_report_cooldown_until';

// ============================================================================
// ICON MAP — Maps string identifiers from undpTypes.ts to Lucide components
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  // Infrastructure
  'home': Home,
  'building-2': Building2,
  'landmark': Landmark,
  'zap': Zap,
  'route': Route,
  'school': School,
  'trees': Trees,
  'clipboard-list': ClipboardList,
  // Supplementary crisis (tech/human-made only)
  'factory': Factory,
  'bomb': Bomb,
  'flask-conical': FlaskConical,
  'shield-alert': ShieldAlert,
  'swords': Swords,
  'megaphone': Megaphone,
  // Debris & severity
  'alert-triangle': AlertTriangle,
  'check-circle-2': CheckCircle2,
  'help-circle': HelpCircle,
  'x-octagon': XOctagon,
  'alert-octagon': AlertOctagon,
  'minus-circle': MinusCircle,
};

/** Render an icon by its string identifier, falling back to AlertCircle */
const UndpIcon: React.FC<{ name: string; size?: number; className?: string; style?: React.CSSProperties }> = ({
  name,
  size = 16,
  className,
  style,
}) => {
  const IconComponent = ICON_MAP[name] || AlertCircle;
  return <IconComponent size={size} className={className} style={style} aria-hidden="true" />;
};

// ============================================================================
// TYPES
// ============================================================================

interface FormErrors {
  hazardType?: string;
  description?: string;
  name?: string;
  contactNumber?: string;
  location?: string;
  captcha?: string;
  submit?: string;
  // UNDP field errors
  infrastructureTypes?: string;
  infrastructureDetails?: string;
  debrisStatus?: string;
  damageSeverity?: string;
  image?: string;
}

// ============================================================================
// VALIDATION SCHEMAS (per step)
// ============================================================================

const descriptionMax = 1000;
const nameMax = 100;

/** Step 1 validation: Incident Details */
const Step1Schema = z.object({
  hazardType: z.string()
    .min(1, 'Please select a hazard type')
    .refine(val => ALL_HAZARD_TYPES.includes(val), 'Invalid hazard type selected'),
  damageSeverity: z.string()
    .min(1, 'Please select the damage severity level'),
  description: z.string().trim()
    .min(1, 'Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(descriptionMax, `Description must be ${descriptionMax} characters or less`),
});

/** Step 2 validation: Infrastructure & Damage */
const Step2Schema = z.object({
  infrastructureTypes: z.array(z.string())
    .min(1, 'Please select at least one infrastructure type'),
  infrastructureDetails: z.string().trim()
    .min(1, 'Please provide details on the infrastructure'),
  debrisStatus: z.string()
    .min(1, 'Please indicate debris status'),
  hasImage: z.boolean().refine(val => val, 'Please upload a damage assessment photo'),
});

/** Step 3 validation: Location & Contact */
const Step3Schema = z.object({
  latitude: z.number().optional().refine(
    (val): val is number => typeof val === 'number',
    'Please select the hazard location on the map',
  ),
  longitude: z.number().optional().refine(
    (val): val is number => typeof val === 'number',
    'Please select the hazard location on the map',
  ),
  name: z.string().trim()
    .min(1, 'Name is required')
    .max(nameMax, `Name must be ${nameMax} characters or less`)
    .min(2, 'Name must be at least 2 characters'),
  contactNumber: z.string()
    .min(1, 'Contact number is required')
    .refine(
      isValidPhilippinePhoneNumber,
      'Please enter a valid Philippine phone number (e.g., 09123456789, +63 912 345 6789)',
    ),
});

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = [
  { number: 1, title: 'Incident Details', subtitle: 'What happened?' },
  { number: 2, title: 'Infrastructure & Damage', subtitle: 'What was affected?' },
  { number: 3, title: 'Location & Contact', subtitle: 'Where & who?' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CitizenReportForm: React.FC = () => {
  const navigate = useNavigate();
  // PWA-01: Track online/offline status for offline queue routing
  const { isOnline } = useOnlineStatus();
  // const turnstileRef = useRef<TurnstileInstance | null>(null); // TEMPORARILY DISABLED
  // const [turnstileToken, setTurnstileToken] = useState<string | null>(null); // TEMPORARILY DISABLED
  
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<UNDPFormData>({
    hazardType: '',
    description: '',
    name: '',
    contactNumber: '',
    latitude: undefined,
    longitude: undefined,
    image: undefined,
    imageMetadata: undefined,
    website: '', // Honeypot

    // UNDP fields
    infrastructureTypes: [],
    infrastructureOtherText: '',
    infrastructureDetails: '',
    crisisCategories: {
      technological_hazards: [],
      human_made_crises: [],
    },
    debrisStatus: '',
    damageSeverity: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<number | null>(null);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (!stored) return;
      const retryAt = Number(stored);
      if (!Number.isFinite(retryAt) || retryAt <= Date.now()) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        return;
      }
      setRateLimitRetryAt(retryAt);
    } catch {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
    }
  }, []);

  // Character counts
  const descriptionLength = formData.description.length;

  // Live countdown when rate-limited
  useEffect(() => {
    if (rateLimitRetryAt == null) return;
    const formatRemaining = (sec: number): string => {
      if (sec <= 0) return '0 sec';
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      if (min > 0) return `${min} min ${s} sec`;
      return `${s} sec`;
    };
    const tick = () => {
      const remaining = Math.ceil((rateLimitRetryAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setRateLimitRetryAt(null);
        setErrors(prev => ({ ...prev, submit: undefined }));
        try { localStorage.removeItem(COOLDOWN_STORAGE_KEY); } catch { /* ignore */ }
        return;
      }
      setErrors(prev => ({
        ...prev,
        submit: `Too many report submissions. You can submit again in ${formatRemaining(remaining)}.`,
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitRetryAt]);

  // ============================================================================
  // STEP VALIDATION
  // ============================================================================

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      const result = Step1Schema.safeParse({
        hazardType: formData.hazardType,
        damageSeverity: formData.damageSeverity,
        description: formData.description,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (field === 'hazardType' && !newErrors.hazardType) {
            newErrors.hazardType = issue.message;
          } else if (field === 'damageSeverity' && !newErrors.damageSeverity) {
            newErrors.damageSeverity = issue.message;
          } else if (field === 'description' && !newErrors.description) {
            newErrors.description = issue.message;
          }
        }
        setErrors(newErrors);
        return false;
      }
    }

    if (step === 2) {
      const result = Step2Schema.safeParse({
        infrastructureTypes: formData.infrastructureTypes,
        infrastructureDetails: formData.infrastructureDetails,
        debrisStatus: formData.debrisStatus,
        hasImage: !!formData.image,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (field === 'infrastructureTypes' && !newErrors.infrastructureTypes) {
            newErrors.infrastructureTypes = issue.message;
          } else if (field === 'infrastructureDetails' && !newErrors.infrastructureDetails) {
            newErrors.infrastructureDetails = issue.message;
          } else if (field === 'debrisStatus' && !newErrors.debrisStatus) {
            newErrors.debrisStatus = issue.message;
          } else if (field === 'hasImage' && !newErrors.image) {
            newErrors.image = issue.message;
          }
        }
        setErrors(newErrors);
        return false;
      }
    }

    if (step === 3) {
      const result = Step3Schema.safeParse({
        latitude: formData.latitude,
        longitude: formData.longitude,
        name: formData.name,
        contactNumber: formData.contactNumber,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if ((field === 'latitude' || field === 'longitude') && !newErrors.location) {
            newErrors.location = issue.message;
          } else if (field === 'name' && !newErrors.name) {
            newErrors.name = issue.message;
          } else if (field === 'contactNumber' && !newErrors.contactNumber) {
            newErrors.contactNumber = issue.message;
          }
        }
        setErrors(newErrors);
        return false;
      }
    }

    setErrors({});
    return true;
  };

  const validateForm = (): boolean => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof UNDPFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleInfrastructureType = (type: InfrastructureType) => {
    setFormData(prev => {
      const current = prev.infrastructureTypes;
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, infrastructureTypes: updated };
    });
    if (errors.infrastructureTypes) {
      setErrors(prev => ({ ...prev, infrastructureTypes: undefined }));
    }
  };

  const toggleCrisisOption = (category: CrisisCategoryKey, value: string) => {
    setFormData(prev => {
      const currentCat = prev.crisisCategories[category];
      const updated = currentCat.includes(value)
        ? currentCat.filter(v => v !== value)
        : [...currentCat, value];
      return {
        ...prev,
        crisisCategories: { ...prev.crisisCategories, [category]: updated },
      };
    });
    // Crisis categories are optional — no validation error to clear
  };

  const handleImageUpload = useCallback((file: File | undefined, metadata?: { timestamp?: string; device?: string }) => {
    setFormData(prev => ({ ...prev, image: file, imageMetadata: metadata }));
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: undefined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.image]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    setErrors(prev => ({ ...prev, location: undefined }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot
    if (formData.website) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Guard (TypeScript can't infer validation guarantees these exist)
    if (formData.latitude == null || formData.longitude == null) {
      setErrors(prev => ({ ...prev, location: 'Location is required' }));
      return;
    }

    // -------------------------------------------------------------------------
    // PWA-01: Offline path — save to IndexedDB queue and register Background Sync
    // -------------------------------------------------------------------------
    if (!isOnline) {
      setIsSubmitting(true);
      try {
        const sanitizedName = DOMPurify.sanitize(formData.name.trim());
        const sanitizedDescription = DOMPurify.sanitize(formData.description.trim());
        // Convert File → base64 data URL so the Service Worker can reconstruct
        // the multipart/form-data upload without needing the File prototype.
        let imageDataUrl: string | undefined;
        let imageFileName: string | undefined;
        if (formData.image) {
          imageDataUrl  = await fileToDataUrl(formData.image);
          imageFileName = formData.image.name;
        }

        await enqueueReport({
          hazardType: formData.hazardType,
          description: sanitizedDescription,
          name: sanitizedName,
          contactNumber: formData.contactNumber.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          infrastructureTypes: formData.infrastructureTypes,
          infrastructureOtherText: DOMPurify.sanitize(formData.infrastructureOtherText.trim()),
          infrastructureDetails: DOMPurify.sanitize(formData.infrastructureDetails.trim()),
          crisisCategories: formData.crisisCategories,
          debrisStatus: formData.debrisStatus,
          damageSeverity: formData.damageSeverity,
          // Image serialized as base64 — safe across the IDB ↔ SW context boundary
          imageDataUrl,
          imageFileName,
          // NOTE: apiBaseUrl intentionally omitted — the SW derives it from
          // self.location.hostname at sync time so the production URL
          // (https://agaila.me) never appears in IndexedDB.
        });
        await requestBackgroundSync('agaila-report-sync');
        toast.success(
          'You\'re offline — your report has been saved and will be submitted automatically when you reconnect.',
          { duration: 6000 }
        );
        // Reset form after successful queue
        setFormData({
          hazardType: '',
          description: '',
          name: '',
          contactNumber: '',
          latitude: undefined,
          longitude: undefined,
          image: undefined,
          imageMetadata: undefined,
          website: '',
          infrastructureTypes: [],
          infrastructureOtherText: '',
          infrastructureDetails: '',
          crisisCategories: {
            technological_hazards: [],
            human_made_crises: [],
          },
          debrisStatus: '',
          damageSeverity: '',
        });
        setCurrentStep(1); // Good UX practice to reset the wizard step
        setIsSubmitting(false);
      } catch (err) {
        console.error('[AGAILA] Failed to queue offline report:', err);
        setErrors(prev => ({
          ...prev,
          submit: 'Failed to save your report for offline submission. Please try again.',
        }));
        setIsSubmitting(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Online path
    // -------------------------------------------------------------------------
    setIsSubmitting(true);
    setErrors({});

    try {
      // Backend handles image upload to Supabase Storage
      // Submit form to backend using FormData (backend expects multipart/form-data)
      if (formData.latitude == null || formData.longitude == null) {
        setErrors(prev => ({ ...prev, location: 'Location is required' }));
        setIsSubmitting(false);
        return;
      }

      const sanitizedName = DOMPurify.sanitize(formData.name.trim());
      const sanitizedDescription = DOMPurify.sanitize(formData.description.trim());
      const sanitizedInfraDetails = DOMPurify.sanitize(formData.infrastructureDetails.trim());

      const formDataPayload = new FormData();
      formDataPayload.append('hazard_type', formData.hazardType);
      formDataPayload.append('description', sanitizedDescription);
      formDataPayload.append('name', sanitizedName);
      formDataPayload.append('contact_number', formData.contactNumber.trim());
      formDataPayload.append('latitude', formData.latitude.toString());
      formDataPayload.append('longitude', formData.longitude.toString());

      // UNDP fields
      formDataPayload.append('infrastructure_types', JSON.stringify(formData.infrastructureTypes));
      formDataPayload.append('infrastructure_details', sanitizedInfraDetails);
      if (formData.infrastructureTypes.includes('other') && formData.infrastructureOtherText) {
        formDataPayload.append('infrastructure_other_text', DOMPurify.sanitize(formData.infrastructureOtherText.trim()));
      }
      formDataPayload.append('crisis_categories', JSON.stringify(formData.crisisCategories));
      formDataPayload.append('debris_status', formData.debrisStatus);
      formDataPayload.append('damage_severity', formData.damageSeverity);

      // Image is now mandatory
      if (formData.image) {
        formDataPayload.append('image', formData.image);
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/citizen-reports/submit`, {
        method: 'POST',
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        if (response.status === 429) {
          const retryAfter = typeof detail === 'object' && detail?.retry_after != null
            ? Number(detail.retry_after) : SUBMISSION_COOLDOWN_SECONDS;
          const retryAt = Date.now() + retryAfter * 1000;
          setRateLimitRetryAt(retryAt);
          try { localStorage.setItem(COOLDOWN_STORAGE_KEY, String(retryAt)); } catch { /* ignore */ }
          setErrors(prev => ({ ...prev, submit: `Too many report submissions. You can submit again in ${retryAfter} sec.` }));
          setIsSubmitting(false);
          return;
        }
        throw new Error(typeof detail === 'string' ? detail : detail?.message || 'Failed to submit report');
      }

      const result = await response.json();

      const retryAt = Date.now() + SUBMISSION_COOLDOWN_SECONDS * 1000;
      setRateLimitRetryAt(retryAt);
      try { localStorage.setItem(COOLDOWN_STORAGE_KEY, String(retryAt)); } catch { /* ignore */ }

      navigate(`/report/confirmation/${result.tracking_id}`, {
        state: { trackingId: result.tracking_id },
      });
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to submit report. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // SUB-COMPONENTS
  // ============================================================================

  /** Progress bar showing the current step */
  const ProgressBar = () => (
    <div className="mb-8" role="navigation" aria-label="Form progress">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 font-bold text-sm ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                        ? 'border-primary bg-primary/10 text-primary dark:text-white dark:bg-primary/25 ring-4 ring-primary/20'
                        : 'border-border bg-muted text-muted-foreground'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? <Check size={18} /> : step.number}
                </div>
                <span className={`mt-2 text-xs font-medium text-center leading-tight hidden sm:block ${
                  isActive ? 'text-primary dark:text-white' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-shrink-0 h-0.5 w-8 sm:w-16 mt-[-20px] sm:mt-[-10px] transition-colors duration-300 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  /** Chip-based multi-select toggle button with Lucide icon */
  const Chip: React.FC<{
    label: string;
    iconName: string;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
    color?: string;
    bgColor?: string;
  }> = ({ label, iconName, selected, onClick, disabled, color, bgColor }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
        selected
          ? 'border-primary bg-primary/10 text-primary dark:text-white dark:bg-primary/20 ring-2 ring-ring shadow-sm'
          : 'border-border bg-card hover:border-muted-foreground/35 hover:bg-muted/60 text-foreground'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={selected}
    >
      <span
        className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
        style={bgColor && color ? { backgroundColor: bgColor, color } : undefined}
      >
        <UndpIcon name={iconName} size={16} style={color ? { color } : undefined} />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );

  // ============================================================================
  // STEP RENDERERS
  // ============================================================================

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
      {/* Hazard Type */}
      <div>
        <label htmlFor="hazard-type" className="block text-sm font-semibold text-foreground mb-3">
          Hazard Type <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ALL_HAZARD_TYPES.map((type) => {
            const config = HAZARD_ICON_REGISTRY[type as keyof typeof HAZARD_ICON_REGISTRY];
            const isSelected = formData.hazardType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('hazardType', type)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary dark:text-white bg-primary/10 ring-2 ring-ring dark:bg-primary/20'
                    : 'border-border bg-card hover:border-muted-foreground/35 hover:bg-muted/60'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-pressed={isSelected}
              >
                <div
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: config?.bgColor || 'rgba(100, 116, 139, 0.15)',
                    color: config?.color || '#64748b',
                  }}
                >
                  <HazardIcon hazardType={type} size={16} useHazardColor />
                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-primary dark:text-white' : 'text-foreground'}`}>
                  {config?.label || type.replace(/_/g, ' ')}
                </span>
              </button>
            );
          })}
        </div>
        {errors.hazardType && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.hazardType}
          </p>
        )}
      </div>

      {/* Supplementary Crisis Factors (Optional) */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Additional Crisis Factors <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          If the incident also involves technological or human-made factors, select them below.
        </p>
        <div className="space-y-4">
          {(Object.entries(CRISIS_CATEGORIES) as [CrisisCategoryKey, typeof CRISIS_CATEGORIES[CrisisCategoryKey]][]).map(
            ([catKey, category]) => (
              <div key={catKey}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <UndpIcon name={category.iconName} size={14} />
                  {category.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.options.map((option) => {
                    const selected = formData.crisisCategories[catKey].includes(option.value);
                    return (
                      <Chip
                        key={option.value}
                        label={option.label}
                        iconName={option.iconName}
                        selected={selected}
                        onClick={() => toggleCrisisOption(catKey, option.value)}
                        disabled={isSubmitting}
                      />
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Damage Severity */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Damage Severity <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          How severe is the damage at the site?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DAMAGE_SEVERITY_LEVELS.map((level) => {
            const config = DAMAGE_SEVERITY_CONFIG[level];
            const isSelected = formData.damageSeverity === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, damageSeverity: level }));
                  if (errors.damageSeverity) setErrors(prev => ({ ...prev, damageSeverity: undefined }));
                }}
                disabled={isSubmitting}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `border-primary bg-primary/10 dark:bg-primary/20 ring-2 ${config.ring}`
                    : 'border-border bg-card hover:border-muted-foreground/35 hover:bg-muted/60'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-pressed={isSelected}
              >
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-md"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <UndpIcon name={config.iconName} size={18} style={{ color: config.color }} />
                </span>
                <span className={`text-sm font-medium ${isSelected ? 'text-primary dark:text-white' : 'text-foreground'}`}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.damageSeverity && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.damageSeverity}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          maxLength={descriptionMax}
          rows={4}
          placeholder="Please describe what you observed, when it happened, and any immediate dangers..."
          className={`w-full rounded-md border bg-background px-4 py-2 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
            errors.description ? 'border-destructive' : 'border-input'
          }`}
          disabled={isSubmitting}
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.description ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} aria-hidden /> {errors.description}
            </p>
          ) : (
            <span className="text-sm text-muted-foreground">Minimum 20 characters</span>
          )}
          <span className={`text-sm ${descriptionLength > descriptionMax ? 'text-destructive' : 'text-muted-foreground'}`}>
            {descriptionLength}/{descriptionMax}
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
      {/* Infrastructure Type */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Type of Infrastructure <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Select all types of infrastructure affected.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INFRASTRUCTURE_TYPES.map((type) => {
            const config = INFRASTRUCTURE_TYPE_CONFIG[type];
            const selected = formData.infrastructureTypes.includes(type);
            return (
              <Chip
                key={type}
                label={config.label}
                iconName={config.iconName}
                selected={selected}
                onClick={() => toggleInfrastructureType(type)}
                disabled={isSubmitting}
                color={config.color}
                bgColor={config.bgColor}
              />
            );
          })}
        </div>
        {errors.infrastructureTypes && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.infrastructureTypes}
          </p>
        )}

        {/* Conditional "Other" text input */}
        {formData.infrastructureTypes.includes('other') && (
          <div className="mt-3">
            <label htmlFor="infra-other" className="block text-sm font-medium text-foreground mb-1">
              Please specify the infrastructure type:
            </label>
            <input
              id="infra-other"
              type="text"
              value={formData.infrastructureOtherText}
              onChange={(e) => handleInputChange('infrastructureOtherText', e.target.value)}
              placeholder="e.g., Water treatment plant"
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>
        )}
      </div>

      {/* Infrastructure Details */}
      <div>
        <label htmlFor="infra-details" className="block text-sm font-semibold text-foreground mb-1">
          Infrastructure Details <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Provide the name and additional details about the affected infrastructure.
        </p>
        <textarea
          id="infra-details"
          value={formData.infrastructureDetails}
          onChange={(e) => handleInputChange('infrastructureDetails', e.target.value)}
          rows={3}
          placeholder="e.g., Barangay Hall of San Miguel — east wing partially collapsed, roof caved in"
          className={`w-full rounded-md border bg-background px-4 py-2 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
            errors.infrastructureDetails ? 'border-destructive' : 'border-input'
          }`}
          disabled={isSubmitting}
          maxLength={500}
        />
        {errors.infrastructureDetails && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.infrastructureDetails}
          </p>
        )}
      </div>

      {/* Debris Assessment */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Debris Assessment <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Is there any debris that requires clearing on or near the infrastructure site?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEBRIS_OPTIONS.map((option) => {
            const isSelected = formData.debrisStatus === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, debrisStatus: option.value }));
                  if (errors.debrisStatus) setErrors(prev => ({ ...prev, debrisStatus: undefined }));
                }}
                disabled={isSubmitting}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-ring shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground/35 hover:bg-muted/60'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-pressed={isSelected}
              >
                <UndpIcon name={option.iconName} size={24} className={isSelected ? 'text-primary dark:text-white' : 'text-muted-foreground'} />
                <span className={`text-sm font-semibold ${isSelected ? 'text-primary dark:text-white' : 'text-foreground'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        {errors.debrisStatus && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.debrisStatus}
          </p>
        )}
      </div>

      {/* Mandatory Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Damage Assessment Photo <span className="text-destructive">*</span>
        </label>
        <ImageUpload
          onFileSelect={handleImageUpload}
          disabled={isSubmitting}
        />
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <ImageIcon size={12} aria-hidden />
          Required. Max 5MB. JPEG or PNG format. GPS coordinates will be extracted if available.
        </p>
        {errors.image && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.image}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
      {/* Location Picker */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Hazard Location <span className="text-destructive">*</span>
        </label>
        <p className="text-sm text-muted-foreground mb-2">
          Click on the map to place a marker, drag to adjust, or use &quot;Use My Current Location&quot; for GPS.
        </p>
        {errors.location && (
          <p className="mb-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.location}
          </p>
        )}
        <div className={`rounded-lg border border-border overflow-hidden ${errors.location ? 'ring-2 ring-destructive/40' : ''}`}>
          <React.Suspense fallback={
            <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
              <div className="w-6 h-6 rounded-full border-3 border-primary border-t-transparent animate-spin" aria-hidden />
            </div>
          }>
            <LocationPicker
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              onLocationSelect={handleLocationSelect}
              autoLocateOnMount
            />
          </React.Suspense>
        </div>
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
          Your Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          maxLength={nameMax}
          placeholder="Enter your full name"
          className={`w-full rounded-md border bg-background px-4 py-2 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.name ? 'border-destructive' : 'border-input'
          }`}
          disabled={isSubmitting}
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.name ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} aria-hidden /> {errors.name}
            </p>
          ) : (
            <span className="text-sm text-muted-foreground">{formData.name.length}/{nameMax}</span>
          )}
        </div>
      </div>

      {/* Contact Number */}
      <div>
        <label htmlFor="contact-number" className="block text-sm font-semibold text-foreground mb-2">
          Contact Number <span className="text-destructive">*</span>
        </label>
        <input
          id="contact-number"
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => handleInputChange('contactNumber', e.target.value)}
          placeholder="e.g., 09123456789 or +63 912 345 6789"
          className={`w-full rounded-md border bg-background px-4 py-2 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.contactNumber ? 'border-destructive' : 'border-input'
          }`}
          disabled={isSubmitting}
        />
        {errors.contactNumber && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} aria-hidden /> {errors.contactNumber}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Philippine mobile or landline number (e.g., 09123456789, +63 912 345 6789, (02) 123-4567)
        </p>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Damage Assessment Report
          </h1>
          <p className="text-muted-foreground">
            Submit a UNDP-compliant damage assessment to help emergency responders
            prioritize relief operations in your area.
          </p>
          <p className="mt-3 text-sm">
            <Link to="/track" className="text-secondary font-semibold hover:underline">
              Track an existing report
            </Link>
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card text-card-foreground rounded-lg shadow-md border border-border p-6 sm:p-8">
          {/* Progress Bar */}
          <ProgressBar />

          {/* Step Title */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Step {currentStep}: {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Steps */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Honeypot Field (Hidden) */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              style={{ position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Submit/Rate-limit Error */}
            {errors.submit && (
              <div className="mt-6 p-4 rounded-md border border-destructive/30 bg-destructive/10 dark:bg-destructive/15 dark:border-destructive/40">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle size={16} aria-hidden /> {errors.submit}
                </p>
              </div>
            )}

            {/* PWA-01: Offline indicator on the submit button area */}
            {!isOnline && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm">
                <WifiOff size={15} aria-hidden />
                <span>
                  <strong>You&apos;re offline.</strong> Your report will be saved locally and submitted automatically when you reconnect.
                </span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-8 border-t border-border mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-input bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 font-medium"
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} aria-hidden />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-md border border-input bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium shadow-sm"
                  disabled={isSubmitting}
                >
                  Next
                  <ChevronRight size={16} aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || rateLimitRetryAt != null}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2" role="status" aria-live="polite">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    <>
                      <Send size={16} aria-hidden="true" />
                      Submit Report
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="pt-4 border-t border-border mt-6">
              <p className="text-xs text-muted-foreground text-center">
                Your report will be reviewed by local authorities. This form collects personal
                information (name and contact number) solely for follow-up purposes by the
                responding authorities. Your data is handled in accordance with our{' '}
                <a href="/privacy" className="text-secondary font-medium hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CitizenReportForm;