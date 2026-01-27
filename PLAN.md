# MWD WINS API Explorer - Implementation Plan

## Project Overview

Build a modern, single-page web application for GitHub Pages that allows water supply agency staff to explore and visualize data from the Metropolitan Water District of Southern California's WINS API.

### Target Users
- Water supply agency staff
- Analysts exploring consumption patterns
- Developers wanting to understand the API for integration

### Key Goals
1. Provide an intuitive interface to explore available meters and turnouts
2. Visualize interval flow and consumption data with interactive charts
3. Display meter readings and current flow status
4. Serve as API documentation/playground for developers

---

## API Analysis Summary

### Base URL
`https://webservices.mwdsc.org/wins/Public/api/`

### Available Endpoints (Relevant to Explorer)

| Endpoint | Description | Data Returned |
|----------|-------------|---------------|
| `Agency` | List member agencies | OrgID, ShortName, LongName |
| `Agency/Billing` | List billing agencies | Same as above |
| `Meter` | All active billable meters | MeterID, Size info, Multiplier |
| `Meter/{MeterID}` | Single meter details | Same as above |
| `ServConn/Agency` | Service connections by agency | Connection, Status, Capacity, Feeder, Agency, ReadingType |
| `ServConn/Feeder` | Service connections by feeder | Same as above |
| `MeterInterval/{MeterID}/{From}/{To}` | Interval flow data | MeterDate, Flow, Volume, IntervalNum, EndMeterReading |
| `MeterRead/{MeterID}/{From}/{To}` | Begin/end readings | BeginReading, EndReading |
| `WOCurrentFlow/{MeterID}` | Current flow rate | Flow |
| `MeterCalibr` | Calibration data | Meter calibration info |
| `MeterFlow/{MeterID}/{From}/{To}` | Flow data | Flow measurements |

### Data Format
All endpoints support `?type=json` query parameter for JSON responses.

### Important Notes
- Date format: `YYYY-MM-DD` (based on example URL) or `MM-DD-YYYY` (based on docs)
- CORS: Need to verify if API allows cross-origin requests; may need proxy solution
- SSL: Certificate may cause issues in some browsers

---

## Technical Architecture

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast builds, excellent GitHub Pages support)
- **Charting**: Recharts (React-native, responsive, good for time series)
- **Styling**: Tailwind CSS (utility-first, responsive design)
- **State Management**: React Query (TanStack Query) for API caching
- **Date Handling**: date-fns (lightweight, tree-shakeable)
- **Deployment**: GitHub Pages with GitHub Actions

### Why This Stack?
- **React + TypeScript**: Type safety, component reusability, large ecosystem
- **Vite**: Near-instant HMR, optimized production builds, simple GitHub Pages config
- **Recharts**: Best balance of features and bundle size for time-series data
- **Tailwind**: Rapid prototyping, consistent design, small production bundle
- **React Query**: Handles caching, refetching, loading states automatically

### Project Structure
```
mwd-api-explorer/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts          # API client with base config
│   │   ├── endpoints.ts       # Endpoint definitions
│   │   └── types.ts           # TypeScript interfaces for API responses
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── DateRangePicker.tsx
│   │   ├── charts/
│   │   │   ├── FlowChart.tsx
│   │   │   ├── VolumeChart.tsx
│   │   │   └── ComparisonChart.tsx
│   │   ├── meters/
│   │   │   ├── MeterList.tsx
│   │   │   ├── MeterCard.tsx
│   │   │   ├── MeterDetail.tsx
│   │   │   └── MeterSelector.tsx
│   │   ├── agencies/
│   │   │   ├── AgencyList.tsx
│   │   │   └── AgencyCard.tsx
│   │   └── api-explorer/
│   │       ├── EndpointList.tsx
│   │       ├── RequestBuilder.tsx
│   │       └── ResponseViewer.tsx
│   ├── hooks/
│   │   ├── useAgencies.ts
│   │   ├── useMeters.ts
│   │   ├── useMeterInterval.ts
│   │   ├── useMeterRead.ts
│   │   └── useServiceConnections.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── MeterExplorer.tsx
│   │   ├── AgencyExplorer.tsx
│   │   ├── IntervalData.tsx
│   │   └── ApiPlayground.tsx
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   └── exportUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── deploy.yml
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Feature Specifications

### 1. Dashboard (Home Page)
**Purpose**: Quick overview and entry point to main features

**Components**:
- Welcome message explaining the app
- Quick stats panel (total agencies, total meters, etc.)
- Navigation cards to main features
- Recent/favorite meters (stored in localStorage)

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] MWD WINS API Explorer              [Settings]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome to the WINS API Explorer                          │
│  Explore water meter data from MWD's member agencies       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 27 Agencies  │  │ 500+ Meters  │  │ 15 Feeders   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  📊 Meter Explorer  │  │  🏢 Browse Agencies  │          │
│  │  Search and view    │  │  View by member     │          │
│  │  meter details      │  │  agency             │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  📈 Interval Data   │  │  🔧 API Playground  │          │
│  │  Time series flow   │  │  Test API calls    │          │
│  │  visualization      │  │  directly          │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  Recent Meters:  [OC-81] [LA-15] [SD-42]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Agency Explorer
**Purpose**: Browse and explore member agencies and their service connections

**Features**:
- List all member agencies with search/filter
- Click agency to see all associated service connections
- View connections on a table with sorting
- Filter by status (Active, Retired, etc.)
- Filter by reading type (AMR, Manual)

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back] Agency Explorer                                   │
├─────────────────────────────────────────────────────────────┤
│  Search: [________________]  Filter: [All Status ▼]        │
├─────────────────────────────────────────────────────────────┤
│  │ Agency               │ Short    │ Connections │          │
│  ├─────────────────────┼──────────┼─────────────┤          │
│  │ City of Anaheim     │ Anaheim  │ 12          │ [View]   │
│  │ City of Burbank     │ Burbank  │ 8           │ [View]   │
│  │ City of Los Angeles │ LA       │ 45          │ [View]   │
│  │ MWDOC               │ MWDOC    │ 95          │ [View]   │
│  └─────────────────────┴──────────┴─────────────┴──────────┘
│                                                             │
│  ─────── Selected: City of Anaheim ───────                 │
│                                                             │
│  │ Connection │ Status │ Feeder           │ Capacity │ AMR │
│  ├────────────┼────────┼──────────────────┼──────────┤─────│
│  │ A-01       │ Active │ Orange County    │ 10       │ ✓   │
│  │ A-02       │ Active │ Orange County    │ 10       │ ✓   │
│  │ A-03       │ Active │ West Orange Co.  │ 12.5     │ ✓   │
│  └────────────┴────────┴──────────────────┴──────────┴─────┘
└─────────────────────────────────────────────────────────────┘
```

### 3. Meter Explorer
**Purpose**: Search, browse, and view details for individual meters

**Features**:
- Searchable/filterable list of all meters
- Quick filters by agency prefix (A-, B-, OC-, etc.)
- Meter detail view showing:
  - Basic meter info
  - Current flow (real-time)
  - Service connection details
  - Quick link to interval data
- Compare multiple meters side-by-side

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back] Meter Explorer                                    │
├─────────────────────────────────────────────────────────────┤
│  Search: [OC-81___________]  Agency: [All ▼] Status: [▼]   │
├───────────────────────┬─────────────────────────────────────┤
│  Results (filtering)  │  Meter Detail: OC-81                │
│  ┌──────────────────┐ │                                     │
│  │ ● OC-81          │ │  ┌─────────────────────────────┐    │
│  │   OC-82          │ │  │ Current Flow: 1.96 CFS      │    │
│  │   OC-83          │ │  │ Status: Active              │    │
│  │   OC-84          │ │  │ Reading Type: AMR           │    │
│  │   OC-85          │ │  │ Feeder: East Orange Co. #2  │    │
│  │   ...            │ │  │ Agency: MWDOC               │    │
│  └──────────────────┘ │  │ Capacity: 50 CFS            │    │
│                       │  └─────────────────────────────┘    │
│                       │                                     │
│                       │  [View Interval Data] [Add to Compare]
│                       │                                     │
└───────────────────────┴─────────────────────────────────────┘
```

### 4. Interval Data Viewer (Time Series Charts)
**Purpose**: Visualize flow and volume data over time

**Features**:
- Date range picker (with presets: Last 7 days, Last 30 days, Custom)
- Line chart showing flow rate over time
- Bar chart showing volume per interval
- Summary statistics (total volume, avg flow, max flow, min flow)
- Data table with pagination
- Export to CSV/JSON
- Multi-meter comparison overlay

**Charts to Include**:
1. **Flow Over Time** (Line): X=DateTime, Y=Flow (CFS)
2. **Volume by Interval** (Bar): X=Interval, Y=Volume (AF)
3. **Cumulative Volume** (Area): Running total over time period
4. **Daily Aggregation** (Bar): When viewing long date ranges

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  Interval Data: OC-81                                       │
├─────────────────────────────────────────────────────────────┤
│  Date Range: [2025-12-01] to [2025-12-10]  [Apply]         │
│  Presets: [7 Days] [30 Days] [90 Days] [Custom]            │
├─────────────────────────────────────────────────────────────┤
│  Summary                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Total Vol  │ │ Avg Flow   │ │ Max Flow   │ │ Min Flow │ │
│  │ 12.38 AF   │ │ 1.28 CFS   │ │ 1.96 CFS   │ │ 0.85 CFS │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Flow] [Volume] [Cumulative]              [Export CSV ▼]  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    📈                                │   │
│  │  Flow (CFS)                                         │   │
│  │  2.0 ─┬─────────────────────────────────────        │   │
│  │       │    ╭─╮     ╭──╮                             │   │
│  │  1.5 ─┤   ╭╯ ╰╮   ╭╯  ╰╮    ╭─╮                    │   │
│  │       │  ╭╯   ╰───╯    ╰────╯ ╰───                 │   │
│  │  1.0 ─┼──╯                                          │   │
│  │       │                                             │   │
│  │  0.5 ─┤                                             │   │
│  │       └─────────────────────────────────────        │   │
│  │        Dec 1   Dec 3   Dec 5   Dec 7   Dec 9        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Data Table                           [Show: 25 ▼] pg 1/48 │
│  │ Date       │ Time  │ Interval │ Flow  │ Volume │ Reading│
│  ├────────────┼───────┼──────────┼───────┼────────┼────────│
│  │ 2025-12-09 │ 00:00 │ 1        │ 1.28  │ 0.0253 │ 297075 │
│  │ 2025-12-09 │ 00:30 │ 2        │ 1.28  │ 0.0275 │ 297075 │
│  └────────────┴───────┴──────────┴───────┴────────┴────────┘
└─────────────────────────────────────────────────────────────┘
```

### 5. Meter Readings View
**Purpose**: Show begin/end meter readings for a date range

**Features**:
- Simple display of begin and end readings
- Calculate total consumption for period
- Historical readings chart

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  Meter Readings: OC-81                                      │
├─────────────────────────────────────────────────────────────┤
│  Date Range: [2025-12-01] to [2025-12-10]  [Get Readings]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Begin Reading        End Reading        Difference │   │
│  │  29,697,354          29,709,732          12,378     │   │
│  │  (Dec 1, 2025)       (Dec 10, 2025)      (9 days)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6. API Playground
**Purpose**: Allow developers to test API calls directly

**Features**:
- Dropdown to select endpoint
- Dynamic parameter inputs based on endpoint
- Request URL preview
- Execute button
- Response viewer (formatted JSON)
- Copy response / Copy URL buttons
- Example code snippets (JavaScript fetch, Python requests, curl)

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────┐
│  API Playground                                             │
├─────────────────────────────────────────────────────────────┤
│  Endpoint: [MeterInterval ▼]                               │
│                                                             │
│  Parameters:                                                │
│    MeterID:  [OC-81_______]                                │
│    FromDate: [2025-12-09__]                                │
│    ToDate:   [2025-12-10__]                                │
│                                                             │
│  URL Preview:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://webservices.mwdsc.org/wins/Public/api/      │   │
│  │ MeterInterval/OC-81/2025-12-09/2025-12-10?type=json │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Execute Request]                           [Copy URL]     │
├─────────────────────────────────────────────────────────────┤
│  Response:  Status: 200 OK  Time: 245ms     [Copy JSON]    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [                                                   │   │
│  │   {                                                 │   │
│  │     "MeterDate": "2025-12-09T00:00:00",            │   │
│  │     "MeterID": "OC-81",                            │   │
│  │     "Flow": 1.28,                                  │   │
│  │     "Volume": 0.025253,                            │   │
│  │     ...                                            │   │
│  │   }                                                 │   │
│  │ ]                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Code Examples: [JavaScript ▼]                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ const response = await fetch(                       │   │
│  │   'https://webservices.mwdsc.org/wins/Public/api/' +│   │
│  │   'MeterInterval/OC-81/2025-12-09/2025-12-10?type=json'│ │
│  │ );                                                  │   │
│  │ const data = await response.json();                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
**Files to create/modify:**
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration with base path for GH Pages
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind setup
- `postcss.config.js` - PostCSS for Tailwind
- `index.html` - Entry HTML
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main app with routing
- `src/index.css` - Global styles with Tailwind imports
- `src/api/client.ts` - Axios/fetch client setup
- `src/api/types.ts` - TypeScript interfaces
- `.github/workflows/deploy.yml` - GitHub Actions deployment

**Tasks:**
1. Initialize Vite React TypeScript project
2. Install and configure Tailwind CSS
3. Set up React Router for navigation
4. Create API client with base configuration
5. Define TypeScript interfaces for all API responses
6. Set up React Query provider
7. Create GitHub Actions workflow for deployment
8. Verify CORS handling (may need to use a proxy or CORS-anywhere for development)

### Phase 2: Data Layer & Hooks
**Files to create:**
- `src/api/endpoints.ts` - Endpoint URL builders
- `src/hooks/useAgencies.ts`
- `src/hooks/useMeters.ts`
- `src/hooks/useServiceConnections.ts`
- `src/hooks/useMeterInterval.ts`
- `src/hooks/useMeterRead.ts`
- `src/hooks/useCurrentFlow.ts`

**Tasks:**
1. Implement all API endpoint functions
2. Create React Query hooks for each data type
3. Add error handling and loading states
4. Implement caching strategies
5. Test all endpoints with real data

### Phase 3: Common Components & Layout
**Files to create:**
- `src/components/common/Header.tsx`
- `src/components/common/Sidebar.tsx`
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/ErrorMessage.tsx`
- `src/components/common/DateRangePicker.tsx`
- `src/components/common/DataTable.tsx`
- `src/components/common/SearchInput.tsx`

**Tasks:**
1. Create responsive header with navigation
2. Build sidebar for desktop, bottom nav for mobile
3. Design loading and error states
4. Create reusable date range picker
5. Build sortable/filterable data table component
6. Implement search input with debouncing

### Phase 4: Dashboard & Agency Explorer
**Files to create:**
- `src/pages/Dashboard.tsx`
- `src/pages/AgencyExplorer.tsx`
- `src/components/agencies/AgencyList.tsx`
- `src/components/agencies/AgencyCard.tsx`
- `src/components/agencies/ServiceConnectionTable.tsx`

**Tasks:**
1. Build dashboard with statistics cards
2. Create navigation cards to features
3. Implement agency list with search
4. Build service connection table with filters
5. Add agency detail expansion

### Phase 5: Meter Explorer
**Files to create:**
- `src/pages/MeterExplorer.tsx`
- `src/components/meters/MeterList.tsx`
- `src/components/meters/MeterCard.tsx`
- `src/components/meters/MeterDetail.tsx`
- `src/components/meters/MeterSelector.tsx`
- `src/components/meters/CurrentFlowDisplay.tsx`

**Tasks:**
1. Build meter list with search and filters
2. Create meter detail panel
3. Implement current flow display with refresh
4. Add meter comparison selector
5. Link to interval data view

### Phase 6: Interval Data & Charts
**Files to create:**
- `src/pages/IntervalData.tsx`
- `src/components/charts/FlowChart.tsx`
- `src/components/charts/VolumeChart.tsx`
- `src/components/charts/CumulativeChart.tsx`
- `src/components/charts/ComparisonChart.tsx`
- `src/utils/chartUtils.ts`
- `src/utils/exportUtils.ts`

**Tasks:**
1. Install and configure Recharts
2. Build flow line chart with tooltips
3. Create volume bar chart
4. Implement cumulative area chart
5. Add chart type selector tabs
6. Build summary statistics panel
7. Create data table with pagination
8. Implement CSV/JSON export
9. Add multi-meter comparison overlay

### Phase 7: API Playground
**Files to create:**
- `src/pages/ApiPlayground.tsx`
- `src/components/api-explorer/EndpointSelector.tsx`
- `src/components/api-explorer/ParameterForm.tsx`
- `src/components/api-explorer/ResponseViewer.tsx`
- `src/components/api-explorer/CodeSnippets.tsx`

**Tasks:**
1. Create endpoint dropdown with all available APIs
2. Build dynamic parameter form
3. Implement request execution
4. Create formatted JSON response viewer
5. Add code snippet generator (JS, Python, curl)
6. Implement copy functionality

### Phase 8: Polish & Deployment
**Tasks:**
1. Responsive design testing on mobile/tablet
2. Add dark mode support (optional)
3. Performance optimization (lazy loading routes)
4. Error boundary implementation
5. Add helpful tooltips and documentation
6. SEO meta tags
7. Final GitHub Pages deployment
8. Create user guide/README

---

## CORS Handling Strategy

The WINS API may not support CORS for browser requests. Options:

### Option A: CORS Proxy (Development)
Use a proxy server during development:
```javascript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://webservices.mwdsc.org/wins/Public',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
}
```

### Option B: Serverless Function Proxy (Production)
For GitHub Pages (static hosting), options include:
1. **Cloudflare Workers** - Free tier proxy function
2. **Vercel/Netlify Functions** - If willing to use those platforms instead
3. **Public CORS Proxy** - cors-anywhere or similar (less reliable)

### Option C: User-Provided Proxy
Allow users to configure their own proxy URL in settings.

### Recommended Approach
Start with Option A for development. Test if the API actually blocks CORS (it may not). If blocked in production, implement a Cloudflare Worker proxy (free tier supports this well).

---

## Data Export Formats

### CSV Export
```csv
MeterID,Date,Time,Interval,Flow (CFS),Volume (AF),End Reading
OC-81,2025-12-09,00:00,1,1.28,0.0253,29707569
OC-81,2025-12-09,00:30,2,1.28,0.0275,29707581
```

### JSON Export
```json
{
  "meter": "OC-81",
  "dateRange": { "from": "2025-12-09", "to": "2025-12-10" },
  "data": [
    { "date": "2025-12-09", "interval": 1, "flow": 1.28, "volume": 0.0253 }
  ]
}
```

---

## Accessibility Considerations

1. Semantic HTML throughout
2. ARIA labels on interactive elements
3. Keyboard navigation support
4. Color contrast meeting WCAG AA
5. Screen reader friendly data tables
6. Focus indicators on all interactive elements

---

## Additional Features to Consider (Future)

1. **Favorites/Bookmarks**: Save frequently accessed meters
2. **Alerts**: Set up flow threshold notifications (would need backend)
3. **Comparison Reports**: Generate PDF reports comparing meters
4. **Map View**: Show meter locations on map (if lat/long available)
5. **Historical Trends**: Year-over-year comparisons
6. **Offline Support**: PWA with cached recent data
7. **User Preferences**: Store in localStorage (units, default date ranges)

---

## Success Metrics

1. All WINS API endpoints accessible through the explorer
2. Charts render smoothly with 1000+ data points
3. Page load < 3 seconds on 3G
4. Mobile-responsive at all breakpoints
5. Data exports work correctly
6. API playground generates correct URLs

---

## Open Questions for User

1. **CORS**: Do you have information on whether the API supports CORS, or should we plan for a proxy solution?
2. **Branding**: Any specific color scheme or branding to match MWD/agency standards?
3. **Priority Features**: Which features are most important if we need to reduce scope?
4. **Authentication**: Is the API fully public, or do some endpoints require auth?
5. **Data Frequency**: How frequently should we auto-refresh current flow data?
