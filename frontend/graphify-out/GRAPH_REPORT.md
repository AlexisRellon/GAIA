# Graph Report - frontend  (2026-04-26)

## Corpus Check
- 139 files · ~1,155,602 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 481 nodes · 440 edges · 23 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `fetchAPI()` - 15 edges
2. `_FakeQuery` - 12 edges
3. `_FakeQuery` - 9 edges
4. `_FakeSupabase` - 7 edges
5. `_FakeSupabase` - 7 edges
6. `_MockQuery` - 6 edges
7. `_MockSupabase` - 6 edges
8. `g()` - 5 edges
9. `getNthColumn()` - 5 edges
10. `enableUI()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `DocumentTitleManager()` --calls--> `useDocumentTitle()`  [INFERRED]
  frontend\src\App.tsx → frontend\src\hooks\useDocumentTitle.ts
- `Header()` --calls--> `useAuth()`  [INFERRED]
  frontend\src\components\landing\Header.tsx → frontend\src\contexts\AuthContext.tsx
- `getHazardMarkerIcon()` --calls--> `getHazardIcon()`  [INFERRED]
  frontend\src\components\map\hazardMarkerIcon.ts → frontend\src\constants\hazard-icons.tsx
- `handleSubmit()` --calls--> `signIn()`  [INFERRED]
  frontend\src\pages\Login.tsx → frontend\src\contexts\AuthContext.tsx
- `handleLogout()` --calls--> `signOut()`  [INFERRED]
  frontend\src\pages\Dashboard.tsx → frontend\src\contexts\AuthContext.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (15): bulkDeleteRSSArticles(), createFeed(), deleteFeed(), fetchAPI(), fetchRSSArticles(), getCurrentJob(), getFeedPerformance(), getLogs() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (13): signIn(), signOut(), useAuth(), handleLogout(), Header(), handleSubmit(), useRealtimeHazards(), useRealtimeNotifications() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (6): _MockQuery, _MockSupabase, _request(), test_check_email_normalizes_before_query(), test_check_email_raises_422_for_unknown_email(), fetchUserProfile()

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (6): _FakeQuery, _FakeResponse, _FakeSupabase, test_audit_logs_accepts_event_filter_alias(), test_triage_rejected_status_does_not_force_validated_by_null(), test_triage_unverified_still_filters_validated_by_null()

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (4): _FakeQuery, _FakeSupabase, test_source_breakdown_returns_counts_and_percentages(), test_trends_include_current_day()

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (9): getAllHazardTypes(), getHazardIcon(), HazardIcon(), searchHazardsByKeyword(), escapeHtml(), evictCacheIfNeeded(), getDefaultIconSvg(), getHazardMarkerIcon() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (3): formatFileSize(), isHeicFile(), validateFile()

### Community 8 - "Community 8"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (3): dedupeHazards(), normalizeSourceUrl(), normalizeTitle()

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (3): handleAddFeed(), handleEditFeed(), validateForm()

### Community 13 - "Community 13"
Cohesion: 0.31
Nodes (4): buildQueryString(), fetchHazards(), fetchValidatedHazards(), fetchValidatedHazardsCompat()

### Community 16 - "Community 16"
Cohesion: 0.39
Nodes (5): getFilterSummary(), getTimeRange(), handleGenerateReport(), sanitizeFilename(), sanitizeText()

### Community 21 - "Community 21"
Cohesion: 0.38
Nodes (4): formatInManila(), formatTimeWindow(), handleCustomRangeSubmit(), manilaWallClockToUtc()

### Community 22 - "Community 22"
Cohesion: 0.43
Nodes (4): sanitizeEmail(), sanitizeInput(), sanitizeObject(), useSanitizedInput()

### Community 23 - "Community 23"
Cohesion: 0.53
Nodes (4): createCustomClusterIcon(), getClusterDimensions(), getClusterSizeClass(), getDominantHazardType()

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (2): handleSubmit(), validateForm()

### Community 25 - "Community 25"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): handleEdit(), validateValue()

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (2): DocumentTitleManager(), useDocumentTitle()

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (2): formatHazardType(), formatLabelForTooltip()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (2): computeTooltipPosition(), MapOnboarding()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (1): Toaster()

## Knowledge Gaps
- **Thin community `Community 24`** (6 nodes): `formatRemaining()`, `handleInputChange()`, `handleSubmit()`, `tick()`, `validateForm()`, `CitizenReportForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (5 nodes): `SystemConfig.tsx`, `getValueTypeBadge()`, `handleEdit()`, `onSave()`, `validateValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (4 nodes): `DocumentTitleManager()`, `App.tsx`, `useDocumentTitle.ts`, `useDocumentTitle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (4 nodes): `formatHazardType()`, `formatLabelForTooltip()`, `renderColorLegend()`, `OptimizedCharts.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `computeTooltipPosition()`, `getTargetRect()`, `MapOnboarding()`, `MapOnboarding.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `Toaster()`, `sonner.tsx`, `sonner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_FakeQuery` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._