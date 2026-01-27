import { ApiEndpoint } from './types'

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'agency',
    name: 'Member Agencies',
    path: 'Agency',
    description: 'Retrieves a list of organizations that are Member Agencies',
    parameters: [],
  },
  {
    id: 'agency-billing',
    name: 'Billing Agencies',
    path: 'Agency/Billing',
    description: 'Retrieves a list of organizations that are Billing Agencies',
    parameters: [],
  },
  {
    id: 'meter',
    name: 'All Meters',
    path: 'Meter',
    description: 'Returns a list of all active billable meters',
    parameters: [],
  },
  {
    id: 'meter-single',
    name: 'Single Meter',
    path: 'Meter/{MeterID}',
    description: 'Returns a single active billable meter',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier (e.g., OC-81)',
        placeholder: 'OC-81',
      },
    ],
  },
  {
    id: 'servconn-agency',
    name: 'Service Connections by Agency',
    path: 'ServConn/Agency',
    description: 'Returns Service Connections sorted by Agency',
    parameters: [],
  },
  {
    id: 'servconn-feeder',
    name: 'Service Connections by Feeder',
    path: 'ServConn/Feeder',
    description: 'Returns Service Connections sorted by Feeder',
    parameters: [],
  },
  {
    id: 'meter-interval',
    name: 'Meter Interval Data',
    path: 'MeterInterval/{MeterID}/{FromDate}/{ToDate}',
    description: 'Returns interval flow data for a meter within a date range',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier',
        placeholder: 'OC-81',
      },
      {
        name: 'FromDate',
        type: 'date',
        required: true,
        description: 'Start date (YYYY-MM-DD)',
        placeholder: '2025-12-01',
      },
      {
        name: 'ToDate',
        type: 'date',
        required: true,
        description: 'End date (YYYY-MM-DD)',
        placeholder: '2025-12-10',
      },
    ],
  },
  {
    id: 'meter-read',
    name: 'Meter Readings',
    path: 'MeterRead/{MeterID}/{FromDate}/{ToDate}',
    description: 'Returns beginning and ending meter readings for a date range',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier',
        placeholder: 'OC-81',
      },
      {
        name: 'FromDate',
        type: 'date',
        required: true,
        description: 'Start date (YYYY-MM-DD)',
        placeholder: '2025-12-01',
      },
      {
        name: 'ToDate',
        type: 'date',
        required: true,
        description: 'End date (YYYY-MM-DD)',
        placeholder: '2025-12-10',
      },
    ],
  },
  {
    id: 'current-flow',
    name: 'Current Flow',
    path: 'WOCurrentFlow/{MeterID}',
    description: 'Returns the latest meter flow',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier',
        placeholder: 'OC-81',
      },
    ],
  },
  {
    id: 'meter-calibr',
    name: 'All Meter Calibrations',
    path: 'MeterCalibr',
    description: 'Returns latest calibration data for all meters',
    parameters: [],
  },
  {
    id: 'meter-calibr-single',
    name: 'Meter Calibration',
    path: 'MeterCalibr/{MeterID}',
    description: 'Returns calibration data for a specific meter',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier',
        placeholder: 'OC-81',
      },
    ],
  },
  {
    id: 'meter-flow',
    name: 'Meter Flow Data',
    path: 'MeterFlow/{MeterID}/{FromDate}/{ToDate}',
    description: 'Returns flow data for a meter within a date range',
    parameters: [
      {
        name: 'MeterID',
        type: 'string',
        required: true,
        description: 'The meter identifier',
        placeholder: 'OC-81',
      },
      {
        name: 'FromDate',
        type: 'date',
        required: true,
        description: 'Start date (YYYY-MM-DD)',
        placeholder: '2025-12-01',
      },
      {
        name: 'ToDate',
        type: 'date',
        required: true,
        description: 'End date (YYYY-MM-DD)',
        placeholder: '2025-12-10',
      },
    ],
  },
]

export function buildEndpointPath(endpoint: ApiEndpoint, params: Record<string, string>): string {
  let path = endpoint.path
  for (const param of endpoint.parameters) {
    path = path.replace(`{${param.name}}`, params[param.name] || '')
  }
  return path
}
