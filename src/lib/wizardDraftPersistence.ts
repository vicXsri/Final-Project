// The wizard draft is normalized and saved here so sessions survive refreshes.
import { createInitialDraft } from "@/core/domain/defaults";
import type { MeasurementKind, TraceAssignment, WizardDraft } from "@/types/contracts";

const STORAGE_KEY = "qcl-characterization-web-draft";
const SESSION_FILE_NAME = "qcl-characterization-session.json";

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
  showOpenFilePicker?: (options?: {
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<
    Array<{
      getFile: () => Promise<File>;
    }>
  >;
};

function mergeTraceAssignments(
  baseAssignments: Record<MeasurementKind, TraceAssignment>,
  savedAssignments?: Partial<Record<MeasurementKind, Partial<TraceAssignment>>>,
) {
  const merged = { ...baseAssignments };

  if (!savedAssignments) {
    return merged;
  }

  (Object.keys(baseAssignments) as MeasurementKind[]).forEach((kind) => {
    const saved = savedAssignments[kind];
    if (!saved) {
      return;
    }

    // Keep the base shape intact even if an imported draft is only half-filled.
    merged[kind] = {
      ...baseAssignments[kind],
      ...saved,
      files: Array.isArray(saved.files) ? saved.files : baseAssignments[kind].files,
      notes: typeof saved.notes === "string" ? saved.notes : baseAssignments[kind].notes,
    };
  });

  return merged;
}

export function normalizeDraft(candidate: unknown): WizardDraft {
  const base = createInitialDraft();

  if (!candidate || typeof candidate !== "object") {
    return base;
  }

  const saved = candidate as Partial<WizardDraft>;

  return {
    // Nested spreads make sure older session files still pick up new defaults.
    projectMetadata: {
      ...base.projectMetadata,
      ...saved.projectMetadata,
      workflows: {
        ...base.projectMetadata.workflows,
        ...(saved.projectMetadata?.workflows ?? {}),
      },
      device: {
        ...base.projectMetadata.device,
        ...saved.projectMetadata?.device,
        dimensions: {
          ...base.projectMetadata.device.dimensions,
          ...saved.projectMetadata?.device?.dimensions,
        },
      },
    },
    measurementSetup: {
      pulsed: {
        ...base.measurementSetup.pulsed,
        ...saved.measurementSetup?.pulsed,
      },
      cw: {
        ...base.measurementSetup.cw,
        ...saved.measurementSetup?.cw,
      },
    },
    traceAssignments: mergeTraceAssignments(base.traceAssignments, saved.traceAssignments),
  };
}

export function loadPersistedDraft() {
  if (typeof window === "undefined") {
    return createInitialDraft();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialDraft();
  }

  try {
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return createInitialDraft();
  }
}

export function savePersistedDraft(draft: WizardDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft, null, 2));
}

export function clearPersistedDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function downloadDraftJson(draft: WizardDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
  const pickerWindow = window as FilePickerWindow;

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    return pickerWindow
      .showSaveFilePicker({
        suggestedName: SESSION_FILE_NAME,
        types: [
          {
            description: "JSON file",
            accept: { "application/json": [".json"] },
          },
        ],
      })
      .then(async (handle) => {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      });
  }

  // Old browsers fall back to a normal download link.
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = SESSION_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function pickDraftJsonFile() {
  if (typeof window === "undefined") {
    return null;
  }

  const pickerWindow = window as FilePickerWindow;
  if (typeof pickerWindow.showOpenFilePicker !== "function") {
    return null;
  }

  const [handle] = await pickerWindow.showOpenFilePicker({
    excludeAcceptAllOption: true,
    multiple: false,
    types: [
      {
        description: "JSON file",
        accept: { "application/json": [".json"] },
      },
    ],
  });

  return handle?.getFile() ?? null;
}
