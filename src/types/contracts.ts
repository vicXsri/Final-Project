// Shared data shapes for forms, parsed files, processed results, and reports.
export type MeasurementKind =
  | "pulsedLiv"
  | "cwLiv"
  | "pulsedSpectraFixedTemperature"
  | "pulsedSpectraFixedCurrent"
  | "cwSpectraFixedTemperature"
  | "cwSpectraFixedCurrent";

export type MeasurementSection = "liv" | "fixedTemperature" | "fixedCurrent";

export interface DeviceMetadata {
  waferNumber: string;
  deviceName: string;
  design: string;
  waveguide: "SM" | "DM";
  approxEmissionFrequencyThz?: number;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
}

export interface ProjectMetadata {
  author: string;
  date: string;
  workflows: {
    pulsed: boolean;
    cw: boolean;
  };
  device: DeviceMetadata;
}

export interface ModeMeasurementSettings {
  cryostat: string;
  livDetector: string;
  spectraDetector: string;
  powerSupply: string;
  spectrometer: string;
  enabledSections: MeasurementSection[];
  powerScale: number;
  tMax?: number;
  driveFrequency?: number;
  dutyCycle?: number;
  gateFrequency?: number;
  fMin?: number;
  fMax?: number;
  tFix?: number;
  iFix?: number;
}

export interface MeasurementSetup {
  pulsed: ModeMeasurementSettings;
  cw: ModeMeasurementSettings;
}

export interface UploadedMeasurementFile {
  id: string;
  datasetName: string;
  fileName: string;
  traceValue: number;
  rawContent: string;
}

export interface TraceAssignment {
  datasetName: string;
  traceVariableLabel: string;
  notes: string;
  files: UploadedMeasurementFile[];
}

export interface LivPoint {
  currentMa: number;
  electricalValue: number;
  opticalValue: number;
}

export interface SpectraPoint {
  frequencyThz: number;
  intensity: number;
}

export interface LivTrace {
  traceValue: number;
  fileName: string;
  points: LivPoint[];
}

export interface SpectraTrace {
  traceValue: number;
  fileName: string;
  points: SpectraPoint[];
}

export interface LivDataset {
  kind: "liv";
  datasetName: string;
  traceVariableLabel: string;
  traces: LivTrace[];
}

export interface SpectraDataset {
  kind: "spectra";
  datasetName: string;
  traceVariableLabel: string;
  traces: SpectraTrace[];
}

export interface ProcessedLivTrace extends LivTrace {
  normalizedOpticalValues: number[];
}

export interface ProcessedLivResult {
  datasetName: string;
  traceVariableLabel: string;
  traces: ProcessedLivTrace[];
  currentRange: { min: number; max: number };
  currentDensityRange: { min: number; max: number };
  voltageRange: { min: number; max: number };
  opticalRange: { min: number; max: number };
  opticalDisplayRange: { min: number; max: number };
  opticalUnit: string;
}

export interface ProcessedSpectraTrace extends SpectraTrace {
  normalizedIntensities: number[];
  peakFrequencyThz: number;
}

export interface ProcessedSpectraResult {
  datasetName: string;
  traceVariableLabel: string;
  traces: ProcessedSpectraTrace[];
  frequencyRange: { min: number; max: number };
}

export interface ReportSummary {
  title: string;
  overview: string[];
  generatedAt: string;
}

export interface WizardDraft {
  projectMetadata: ProjectMetadata;
  measurementSetup: MeasurementSetup;
  traceAssignments: Record<MeasurementKind, TraceAssignment>;
}
