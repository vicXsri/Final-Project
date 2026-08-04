// The first wizard form collects device metadata and workflow choices.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { z } from "zod";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { setupSchema } from "./schemas";

type SetupFormValues = z.infer<typeof setupSchema>;

export function SetupParametersForm() {
  const navigate = useNavigate();
  const { draft, setProjectMetadata } = useWizard();
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema) as never,
    defaultValues: {
      author: draft.projectMetadata.author,
      date: draft.projectMetadata.date,
      pulsedEnabled: draft.projectMetadata.workflows.pulsed,
      cwEnabled: draft.projectMetadata.workflows.cw,
      waferNumber: draft.projectMetadata.device.waferNumber,
      deviceName: draft.projectMetadata.device.deviceName,
      design: draft.projectMetadata.device.design,
      waveguide: draft.projectMetadata.device.waveguide,
      approxEmissionFrequencyThz: draft.projectMetadata.device.approxEmissionFrequencyThz,
      width: draft.projectMetadata.device.dimensions.width,
      length: draft.projectMetadata.device.dimensions.length,
      height: draft.projectMetadata.device.dimensions.height,
    },
  });
  const pulsedEnabled = useWatch({ control: form.control, name: "pulsedEnabled" });
  const cwEnabled = useWatch({ control: form.control, name: "cwEnabled" });

  const onSubmit = form.handleSubmit((values) => {
    setProjectMetadata({
      author: values.author,
      date: values.date,
      workflows: {
        pulsed: values.pulsedEnabled,
        cw: values.cwEnabled,
      },
      device: {
        waferNumber: values.waferNumber,
        deviceName: values.deviceName,
        design: values.design,
        waveguide: values.waveguide,
        approxEmissionFrequencyThz: values.approxEmissionFrequencyThz,
        dimensions: {
          width: values.width,
          length: values.length,
          height: values.height,
        },
      },
    });
    navigate(values.pulsedEnabled ? "/wizard/measurement-pulsed" : "/wizard/measurement-cw");
  });

  return (
    <Card>
      <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
        <FormField label="Author"><Input {...form.register("author")} /></FormField>
        <FormField label="Date"><Input type="date" {...form.register("date")} /></FormField>
        <div className="md:col-span-2 grid gap-2">
          <div className="text-sm font-medium text-[var(--color-ink)]">Measurement workflows</div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => form.setValue("pulsedEnabled", !form.getValues("pulsedEnabled"), { shouldValidate: true })}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                pulsedEnabled
                  ? "border-[#2d8cff] bg-[#eaf4ff] text-[#1d6fd8]"
                  : "border-[var(--color-line)] bg-white text-[var(--color-slate)]",
              )}
            >
              Pulsed LIV
            </button>
            <button
              type="button"
              onClick={() => form.setValue("cwEnabled", !form.getValues("cwEnabled"), { shouldValidate: true })}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                cwEnabled
                  ? "border-[#2d8cff] bg-[#eaf4ff] text-[#1d6fd8]"
                  : "border-[var(--color-line)] bg-white text-[var(--color-slate)]",
              )}
            >
              CW LIV
            </button>
          </div>
          {form.formState.errors.pulsedEnabled ? (
            <div className="text-sm text-red-600">{form.formState.errors.pulsedEnabled.message}</div>
          ) : null}
        </div>
        <FormField label="Wafer number"><Input {...form.register("waferNumber")} /></FormField>
        <FormField label="Device name"><Input {...form.register("deviceName")} /></FormField>
        <FormField label="Design">
          <Select {...form.register("design")}>
            <option value="N/A">N/A</option>
            <option value="BTC">BTC</option>
            <option value="LO phonon">LO phonon</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Other">Other</option>
          </Select>
        </FormField>
        <FormField label="Waveguide">
          <Select {...form.register("waveguide")}>
            <option value="SM">SM</option>
            <option value="DM">DM</option>
          </Select>
        </FormField>
        <FormField label="Approx. emission frequency (THz)">
          <Input type="number" step="0.01" {...form.register("approxEmissionFrequencyThz")} />
        </FormField>
        <FormField label="Width (um)"><Input type="number" step="0.1" {...form.register("width")} /></FormField>
        <FormField label="Length (mm)"><Input type="number" step="0.1" {...form.register("length")} /></FormField>
        <FormField label="Height (um)"><Input type="number" step="0.1" {...form.register("height")} /></FormField>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit">Continue to Measurement Setup</Button>
        </div>
      </form>
    </Card>
  );
}
