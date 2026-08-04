// One upload card manages the files and trace values for a single dataset.
// One upload card manages the files and trace values for a single dataset.
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MeasurementKind, TraceAssignment, UploadedMeasurementFile } from "@/types/contracts";
import { Input } from "@/components/ui/input";

interface FileAssignmentSectionProps {
  kind: MeasurementKind;
  assignment: TraceAssignment;
  onChange: (files: UploadedMeasurementFile[]) => void;
  onNotesChange: (notes: string) => void;
}

export function FileAssignmentSection({ kind, assignment, onChange, onNotesChange }: FileAssignmentSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const nextFiles = await Promise.all(
      selectedFiles.map(async (file, index) => ({
        id: `${kind}-${file.name}-${Date.now()}-${index}`,
        datasetName: assignment.datasetName,
        fileName: file.name,
        traceValue: 0,
        rawContent: await file.text(),
      })),
    );

    onChange([...assignment.files, ...nextFiles]);
    event.target.value = "";
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{assignment.datasetName}</h3>
            <p className="text-sm text-[var(--color-slate)]">Attach text files and assign {assignment.traceVariableLabel} values.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => inputRef.current?.click()}>
              Add files
            </Button>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileImport} />
        </div>
        {assignment.files.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-slate)]">
            No files added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {assignment.files.map((file) => (
              <div key={file.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
                <div className="grid gap-3 md:grid-cols-[1.3fr_0.6fr]">
                  <div>
                    <div className="font-medium">{file.fileName}</div>
                    <div className="text-sm text-[var(--color-slate)]">
                      {assignment.traceVariableLabel}: {file.traceValue}
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={file.traceValue}
                    onChange={(event) =>
                      onChange(
                        assignment.files.map((current) =>
                          current.id === file.id ? { ...current, traceValue: Number(event.target.value) } : current,
                        ),
                      )
                    }
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChange(assignment.files.filter((current) => current.id !== file.id))}
                  >
                    Remove file
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <div className="mb-2 text-sm font-medium text-[var(--color-ink)]">Experimental notes</div>
          <Textarea
            value={assignment.notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Common notes for this dataset"
          />
        </div>
      </div>
    </Card>
  );
}
