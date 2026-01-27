# MWD WINS API Explorer

A web application for exploring water meter data from the Metropolitan Water District of Southern California (MWD). Browse agencies, search meters, view real-time flow data, and visualize historical usage with interactive charts.

## What is this?

The Metropolitan Water District of Southern California provides public access to water delivery data through their WINS (Water Information System) API. This explorer makes that data accessible through an intuitive interface, allowing anyone to:

- **Browse member agencies** - View the 27 member agencies and their sub-agencies that receive water from MWD
- **Explore meters** - Search through service connections and meters across Southern California
- **View real-time data** - See current flow rates for any meter
- **Analyze historical data** - Visualize 15-minute interval flow and volume data with interactive charts
- **Test the API** - Use the built-in playground to construct and test API calls

## Features

### Dashboard
Overview of the system with quick stats on agencies, meters, and active connections.

### Agency Explorer
Browse all member agencies and retail agencies. View their service connections, filter by status (active/retired), and see connection details like capacity, feeder, and reading type.

### Meter Explorer
Search for specific meters, view detailed connection information, and analyze interval data with:
- **Flow charts** - Line charts showing flow rate (CFS) over time
- **Volume charts** - Bar charts showing water volume (acre-feet) per interval
- **Cumulative charts** - Area charts showing total volume delivered over a date range
- **Data export** - Download data as CSV or JSON

### API Playground
Test API endpoints directly, view responses, and generate code snippets for your own applications.

## Data Source

All data is provided by the **Metropolitan Water District of Southern California** through their public WINS API.

- **API Documentation**: [https://webservices.mwdsc.org/wins/Public/Help](https://webservices.mwdsc.org/wins/Public/Help)
- **Data Provider**: Metropolitan Water District of Southern California

The WINS API provides access to:
- Member and sub-agency information
- Service connection details
- Real-time flow readings
- Historical interval data (15-minute intervals)
- Meter readings

## Technology

Built with:
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Query](https://tanstack.com/query) - Data fetching and caching
- [Recharts](https://recharts.org/) - Charts and visualizations
- [React Router](https://reactrouter.com/) - Navigation

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to GitHub Pages

This project is configured to deploy to GitHub Pages automatically.

### Setup (one-time)

1. Push your code to GitHub
2. Go to your repository **Settings** → **Pages**
3. Under **Build and deployment**, set **Source** to **GitHub Actions**

### Automatic Deployment

Once configured, every push to `main` will automatically:
1. Build the project
2. Deploy to GitHub Pages

Your site will be available at: `https://<username>.github.io/MWD-API-Explorer/`

### Manual Deployment

To deploy manually:

```bash
# Build the project
npm run build

# The dist/ folder contains the built site
```

Then push the `dist/` contents to a `gh-pages` branch, or use the GitHub Actions workflow included in `.github/workflows/deploy.yml`.

### Important Note

The `base` path in `vite.config.ts` is set to `/MWD-API-Explorer/`. If your repository has a different name, update this value to match.

## License

This project is open source. The data displayed is public information provided by MWD.

---

*This application is not affiliated with or endorsed by the Metropolitan Water District of Southern California. It is an independent tool for exploring publicly available data.*
