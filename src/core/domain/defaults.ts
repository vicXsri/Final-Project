// Fresh wizard state is built here so every reset starts from the same shape.
import type { MeasurementKind, TraceAssignment, WizardDraft } from "@/types/contracts";

const datasetDefinitions: Record<
  MeasurementKind,
  { datasetName: string; traceVariableLabel: string }
> = {
  pulsedLiv: { datasetName: "Pulsed LIV", traceVariableLabel: "Temperature (K)" },
  cwLiv: { datasetName: "CW LIV", traceVariableLabel: "Temperature (K)" },
  pulsedSpectraFixedTemperature: {
    datasetName: "Pulsed FTIR - fixed temperature",
    traceVariableLabel: "Current (mA)",
  },
  pulsedSpectraFixedCurrent: {
    datasetName: "Pulsed FTIR - fixed current",
    traceVariableLabel: "Temperature (K)",
  },
  cwSpectraFixedTemperature: {
    datasetName: "CW FTIR - fixed temperature",
    traceVariableLabel: "Current (mA)",
  },
  cwSpectraFixedCurrent: {
    datasetName: "CW FTIR - fixed current",
    traceVariableLabel: "Temperature (K)",
  },
};

export function createEmptyTraceAssignments(): Record<MeasurementKind, TraceAssignment> {
  return Object.fromEntries(
    Object.entries(datasetDefinitions).map(([key, value]) => [key, { ...value, notes: "", files: [] }]),
  ) as unknown as Record<MeasurementKind, TraceAssignment>;
}

export function createInitialDraft(): WizardDraft {
  return {
    projectMetadata: {
      author: "",
      date: new Date().toISOString().slice(0, 10),
      workflows: {
        pulsed: true,
        cw: true,
      },
      device: {
        waferNumber: "",
        deviceName: "",
        design: "N/A",
        waveguide: "SM",
        approxEmissionFrequencyThz: undefined,
        dimensions: { width: 150, length: 2, height: 10 },
      },
    },
    measurementSetup: {
      pulsed: {
        cryostat: "",
        livDetector: "",
        spectraDetector: "",
        powerSupply: "",
        spectrometer: "",
        enabledSections: ["liv"],
        powerScale: 100,
        driveFrequency: 10,
        dutyCycle: 2,
        gateFrequency: 167,
        tMax: undefined,
        fMin: 0,
        fMax: 0,
        tFix: 20,
        iFix: 0,
      },
      cw: {
        cryostat: "",
        livDetector: "",
        spectraDetector: "",
        powerSupply: "",
        spectrometer: "",
        enabledSections: [],
        powerScale: 100,
        driveFrequency: 10,
        dutyCycle: 2,
        gateFrequency: 167,
        tMax: undefined,
        fMin: 0,
        fMax: 0,
        tFix: 20,
        iFix: 0,
      },
    },
    traceAssignments: createEmptyTraceAssignments(),
  };
}
