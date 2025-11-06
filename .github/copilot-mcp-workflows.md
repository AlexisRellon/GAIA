# GAIA Full-Stack MCP Workflows

## Complete Feature Implementation Patterns

This guide provides end-to-end workflows that combine multiple MCP tools across frontend and backend to implement complete features in the GAIA system.

## Workflow 1: Citizen Report Feature (CR-01 → CR-04)

### Overview
Implement complete citizen hazard reporting: form submission → validation → AI processing → triage → map display

### MCP Tools Used
- **Frontend**: Figma MCP, ShadCN MCP, StackHawk MCP, Context7 MCP
- **Backend**: Supabase MCP, Hugging Face MCP, StackHawk MCP
- **Cross-Stack**: Context7 MCP for documentation

### Step-by-Step Implementation

#### Phase 1: Frontend Form Design (CR-01)

```bash
# 1. Extract Figma design
@figma get-design-context nodeId="[citizen-form-node]" clientFrameworks="react" clientLanguages="typescript"
@figma get-variable-defs nodeId="[citizen-form-node]"

# 2. Search for form components
@shadcn search query="form input textarea select button" registries=['@shadcn']
@shadcn get-examples query="form-demo" registries=['@shadcn']

# 3. Install components
@shadcn get-add-command items=['@shadcn/form', '@shadcn/input', '@shadcn/textarea', '@shadcn/select']
docker-compose run frontend npx shadcn@latest add form input textarea select button

# 4. Get reCAPTCHA documentation
@context7 resolve-library-id libraryName="react-google-recaptcha"
@context7 get-library-docs context7CompatibleLibraryID="/react-google-recaptcha/react-google-recaptcha" topic="v3 invisible badge"
```

**Implement Form Component:**
```typescript
// frontend/src/components/citizen-report/CitizenReportForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

const reportSchema = z.object({
  hazardType: z.string().min(1, 'Please select a hazard type'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  contactInfo: z.string().email('Invalid email address').optional(),
  imageUrl: z.string().url().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export const CitizenReportForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      hazardType: '',
      location: '',
      description: '',
      contactInfo: '',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA not loaded');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('submit_report');

      // Submit to Supabase Edge Function
      const { data: result, error } = await supabase.functions.invoke(
        'submit-citizen-report',
        {
          body: {
            ...data,
            recaptchaToken,
            submittedAt: new Date().toISOString(),
          },
        }
      );

      if (error) throw error;

      toast.success('Report submitted successfully!', {
        description: 'Your report will be reviewed shortly.',
      });

      form.reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit report', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="hazardType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hazard Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hazard type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="typhoon">Typhoon</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="landslide">Landslide</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Quezon City, Metro Manila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you observed..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This site is protected by reCAPTCHA and the Google Privacy Policy applies.
        </p>
      </form>
    </Form>
  );
};
```

#### Phase 2: Backend Validation & Processing (CR-02, CR-03)

```bash
# 1. Create Supabase Edge Function
@supabase deploy_edge_function name="submit-citizen-report" entrypoint_path="index.ts" files=[...]

# 2. Get documentation
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="edge functions validation"
@context7 get-library-docs context7CompatibleLibraryID="/google/recaptcha" topic="v3 server validation"

# 3. Create database migration
@supabase apply_migration name="create_citizen_reports_table" query="..."
```

**Implement Edge Function:**
```typescript
// backend/supabase/functions/submit-citizen-report/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RECAPTCHA_SECRET = Deno.env.get("RECAPTCHA_SECRET_KEY");
const BACKEND_URL = Deno.env.get("BACKEND_URL");

serve(async (req) => {
  try {
    const { hazardType, location, description, contactInfo, recaptchaToken } =
      await req.json();

    // 1. Verify reCAPTCHA
    const recaptchaResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`,
      }
    );

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA verification failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Submit to Python backend for AI processing
    const processingResponse = await fetch(`${BACKEND_URL}/api/process-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${hazardType} in ${location}. ${description}`,
        source: "Citizen",
        confidence: 0.3, // Default 30% confidence for citizen reports
        metadata: {
          rawLocation: location,
          userHazardType: hazardType,
          contactInfo,
        },
      }),
    });

    const processingResult = await processingResponse.json();

    return new Response(JSON.stringify(processingResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**Create Database Migration:**
```bash
@supabase apply_migration name="create_citizen_reports_table" query="
  CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    contact_info VARCHAR(255),
    coordinates GEOGRAPHY(POINT, 4326),
    confidence DECIMAL(3, 2) DEFAULT 0.30,
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'validated', 'rejected')),
    recaptcha_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    validated_by UUID REFERENCES auth.users(id)
  );

  CREATE INDEX idx_citizen_reports_status ON citizen_reports(status);
  CREATE INDEX idx_citizen_reports_created ON citizen_reports(created_at DESC);
  
  -- Enable RLS
  ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
  
  -- Allow public inserts (via Edge Function)
  CREATE POLICY citizen_reports_insert_policy ON citizen_reports
    FOR INSERT WITH CHECK (true);
  
  -- Only admins/validators can read
  CREATE POLICY citizen_reports_select_policy ON citizen_reports
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role IN ('admin', 'validator')
      )
    );
"
```

**Implement Backend Processing:**
```python
# backend/python/api/routes.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from models.climate_nli import ClimateNLIClassifier
from models.geo_ner import GeoNER
from pipeline.hazard_pipeline import HazardPipeline

app = FastAPI()
pipeline = HazardPipeline()


class ProcessTextRequest(BaseModel):
    text: str
    source: str  # 'RSS' or 'Citizen'
    confidence: Optional[float] = None
    metadata: Optional[Dict] = None


@app.post("/api/process-text")
async def process_text(request: ProcessTextRequest):
    """
    Process text through AI pipeline
    """
    try:
        result = pipeline.process_text(
            text=request.text,
            source=request.source,
            initial_confidence=request.confidence,
            metadata=request.metadata
        )
        
        if not result:
            raise HTTPException(
                status_code=422,
                detail="Failed to process text"
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Phase 3: Admin Triage Interface (CR-04)

```bash
# 1. Search for table components
@shadcn search query="data table pagination sorting" registries=['@shadcn']
@shadcn get-examples query="table-demo" registries=['@shadcn']

# 2. Install components
docker-compose run frontend npx shadcn@latest add table dialog badge

# 3. Get Supabase RLS documentation
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="row level security policies"
```

**Implement Triage Dashboard:**
```typescript
// frontend/src/components/admin/TriageDashboard.tsx

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

interface CitizenReport {
  id: string;
  hazard_type: string;
  location: string;
  description: string;
  confidence: number;
  status: string;
  created_at: string;
}

export const TriageDashboard: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  useEffect(() => {
    fetchPendingReports();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('citizen_reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'citizen_reports',
        },
        (payload) => {
          setReports((prev) => [payload.new as CitizenReport, ...prev]);
          toast.info('New citizen report received');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPendingReports = async () => {
    const { data, error } = await supabase
      .from('citizen_reports')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load reports');
      return;
    }

    setReports(data || []);
  };

  const validateReport = async (reportId: string, action: 'validated' | 'rejected') => {
    const { error } = await supabase
      .from('citizen_reports')
      .update({
        status: action,
        validated_at: new Date().toISOString(),
        validated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', reportId);

    if (error) {
      toast.error(`Failed to ${action} report`);
      return;
    }

    toast.success(`Report ${action}`);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setSelectedReport(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Citizen Report Triage</h2>
        <Badge variant="outline">{reports.length} pending</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hazard Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Badge>{report.hazard_type}</Badge>
              </TableCell>
              <TableCell>{report.location}</TableCell>
              <TableCell>
                <Badge variant={report.confidence < 0.5 ? 'destructive' : 'secondary'}>
                  {(report.confidence * 100).toFixed(0)}%
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(report.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(report)}
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Citizen Report</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Hazard Type:</label>
                <p>{selectedReport.hazard_type}</p>
              </div>
              <div>
                <label className="font-semibold">Location:</label>
                <p>{selectedReport.location}</p>
              </div>
              <div>
                <label className="font-semibold">Description:</label>
                <p>{selectedReport.description}</p>
              </div>
              <div>
                <label className="font-semibold">AI Confidence:</label>
                <p>{(selectedReport.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => validateReport(selectedReport.id, 'validated')}
                  className="flex-1"
                >
                  Validate
                </Button>
                <Button
                  onClick={() => validateReport(selectedReport.id, 'rejected')}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

#### Phase 4: Security Testing

```bash
# 1. Frontend security scan
@stackhawk get-scan-instructions config_path="frontend/stackhawk.yml"
docker-compose run frontend hawk scan frontend/stackhawk.yml

# 2. Backend API security scan
@stackhawk get-scan-instructions config_path="backend/stackhawk.yml"
docker-compose run backend hawk scan backend/stackhawk.yml

# 3. Review findings
@stackhawk get-app-findings config_path="frontend/stackhawk.yml"
@stackhawk get-app-findings config_path="backend/stackhawk.yml"

# 4. Check Supabase RLS policies
@supabase get_advisors type="security"
```

#### Phase 5: Integration Testing

```bash
# 1. Test frontend form
docker-compose up frontend
# Visit http://localhost:3000/report

# 2. Test backend processing
docker-compose run backend pytest tests/python/integration/test_citizen_report_pipeline.py -v

# 3. Test end-to-end flow
# - Submit report via frontend
# - Check database for pending report
# - Verify AI processing results
# - Test admin validation in triage dashboard

# 4. Performance testing
# - Time-to-Action < 5 minutes
# - Form submission < 2 seconds
# - AI processing < 10 seconds
```

---

## Workflow 2: Map Visualization Feature (GV-01 → GV-03)

### Overview
Implement interactive hazard map with real-time updates, marker clustering, and filtering

### MCP Tools Used
- **Frontend**: Figma MCP, ShadCN MCP, Context7 MCP
- **Backend**: Supabase MCP
- **Documentation**: Context7 MCP (Leaflet, React)

### Implementation Steps

```bash
# 1. Extract map design from Figma
@figma get-design-context nodeId="[map-container-node]" clientFrameworks="react" clientLanguages="typescript"

# 2. Get Leaflet documentation
@context7 resolve-library-id libraryName="leaflet"
@context7 get-library-docs context7CompatibleLibraryID="/leaflet/leaflet" topic="interactive markers clustering"

# 3. Get React Leaflet documentation
@context7 resolve-library-id libraryName="react-leaflet"
@context7 get-library-docs context7CompatibleLibraryID="/react-leaflet/react-leaflet" topic="map container markers popups"

# 4. Create geospatial query optimization
@supabase execute_sql "CREATE INDEX idx_hazards_geom ON hazards USING GIST(coordinates)"

# 5. Get performance advisors
@supabase get_advisors type="performance"
```

[See frontend/COPILOT_INSTRUCTIONS.md for complete implementation]

---

## Workflow 3: RSS Aggregation & Processing (EDI-01)

### Overview
Automated RSS feed aggregation → AI processing → geospatial validation → database storage

### Implementation

```bash
# 1. Get Edge Function documentation
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="edge functions cron triggers"

# 2. Get RSS parser documentation
@context7 resolve-library-id libraryName="rss-parser"

# 3. Search for preprocessing models
@hf model_search query="text preprocessing cleaning" task="text-classification"

# 4. Deploy Edge Function
@supabase deploy_edge_function name="rss-aggregator" entrypoint_path="index.ts" files=[...]

# 5. Security scan
@stackhawk get-app-findings
```

[See backend/COPILOT_INSTRUCTIONS.md for complete implementation]

---

## Workflow 4: Authentication & Authorization (AUTH-01, UM-01)

### Overview
Implement RBAC with Supabase Auth: Master Admin, Validator, LGU Responder roles

### Implementation

```bash
# 1. Get Supabase Auth documentation
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="authentication row level security"

# 2. Create user roles migration
@supabase apply_migration name="create_user_roles" query="..."

# 3. Search for auth form components
@shadcn search query="login form authentication" registries=['@shadcn']

# 4. Get reCAPTCHA documentation
@context7 get-library-docs context7CompatibleLibraryID="/google/recaptcha" topic="v3 integration"

# 5. Security scan
@stackhawk get-app-findings
```

---

## Cross-Stack Testing Checklist

### Before Merging Feature Branch

1. **Frontend Tests**
   ```bash
   docker-compose run frontend npm test --coverage
   docker-compose run frontend npm run lint
   ```

2. **Backend Tests**
   ```bash
   docker-compose run backend pytest tests/python/ -v --cov
   docker-compose run backend black backend/python/
   ```

3. **Integration Tests**
   ```bash
   docker-compose up -d
   # Run E2E tests
   npm run test:e2e
   ```

4. **Security Scans**
   ```bash
   @stackhawk get-app-findings config_path="frontend/stackhawk.yml"
   @stackhawk get-app-findings config_path="backend/stackhawk.yml"
   @supabase get_advisors type="security"
   ```

5. **Performance Tests**
   - Time-to-Action < 5 minutes
   - API response time < 200ms
   - Map rendering < 2 seconds
   - Database queries < 100ms

6. **Manual Testing**
   - Test in Docker environment
   - Verify real-time updates
   - Check mobile responsiveness
   - Test error handling

---

## Quick Reference

### MCP Tool Combinations by Feature

| Feature | Frontend MCP | Backend MCP | Documentation |
|---------|-------------|-------------|---------------|
| UI Components | Figma + ShadCN | - | Context7 |
| AI Pipeline | - | Hugging Face + Supabase | Context7 |
| Security Testing | StackHawk | StackHawk | Context7 |
| Database Operations | - | Supabase | Context7 |
| Real-time Features | ShadCN | Supabase | Context7 |
| Forms & Validation | Figma + ShadCN | Supabase | Context7 |

### Common Command Sequences

**New UI Feature:**
```bash
@figma get-design-context
@shadcn search query="..."
@shadcn get-add-command
docker-compose run frontend npx shadcn@latest add [components]
@stackhawk get-scan-instructions
```

**New AI Model:**
```bash
@hf model_search query="..."
@hf hub_repo_details repo_id="..."
@context7 get-library-docs topic="..."
docker-compose run backend pip install [packages]
@stackhawk get-app-findings
```

**Database Changes:**
```bash
@supabase apply_migration name="..." query="..."
@supabase generate_typescript_types
@supabase get_advisors type="security"
```

---

**Navigation:**
- [Overview](.github/copilot-mcp-tools.md)
- [Frontend Guide](frontend/COPILOT_INSTRUCTIONS.md)
- [Backend Guide](backend/COPILOT_INSTRUCTIONS.md)
