// Agency types
export interface Agency {
  OrgID: string
  AgcyType: string
  ShortName: string
  LongName: string
}

// Meter types
export interface Meter {
  MeterID: string
  SizePrefix: string | null
  SizeSuffix: string | null
  Size: string | null
  Multiplier: string | null
}

// Service Connection types
export interface ServiceConnection {
  Connection: string
  Status: string
  SizePrefix: string
  SizeSuffix: string
  Size: string
  ActivationDate: string
  OriginalCapacity: string
  RequestedCapacity: string
  Feeder: string
  Station: string
  Agency: string
  LocationComments: string
  ReadingType: string
}

// Meter Interval Data
export interface MeterInterval {
  MeterDate: string
  MeterID: string
  Flow: number
  StartDate: string
  EndDate: string
  BillCustID: string
  IntervalNum: number
  EndMeterReading: number
  Volume: number
  ProcessedFlag: string
}

// Meter Read Summary
export interface MeterRead {
  MeterID: string
  BeginReading: number
  EndReading: number
}

// Current Flow
export interface CurrentFlow {
  Flow: string
}

// Meter Calibration
export interface MeterCalibration {
  MeterID: string
  CalibrationDate: string
  CalibrationFactor: number
}

// API Endpoint definition for playground
export interface ApiEndpoint {
  id: string
  name: string
  path: string
  description: string
  parameters: ApiParameter[]
}

export interface ApiParameter {
  name: string
  type: 'string' | 'date'
  required: boolean
  description: string
  placeholder?: string
}
