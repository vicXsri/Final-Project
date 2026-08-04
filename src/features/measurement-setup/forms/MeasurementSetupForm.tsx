// Pulsed and CW setup share this form, with sections toggled by measurement type.
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { z } from "zod";
import {
  cryostatOptions,
  cwPowerSupplyOptions,
  detectorOptions,
  pulsedPowerSupplyOptions,
  spectraDetectorOptions,
  spectrometerOptions,
} from "@/assets/equipmentOptions";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWizard } from "@/features/wizard/context/WizardContext";
import { getEnabledFileSteps, getFileStepHref } from "@/features/wizard/lib/wizardSteps";
import type { MeasurementSection } from "@/types/contracts";
import { measurementSchema } from "./schemas";

type MeasurementValues = z.infer<typeof measurementSchema>;
type MeasurementMode = "pulsed" | "cw";
type SetupView = MeasurementSection;

function OptionSelect({
  options,
  register,
}: {
  options: string[];
  register: UseFormRegisterReturn;
}) {
  return (
    <Select {...register}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}

function getModePrefix(mode: MeasurementMode) {
  return mode === "pulsed" ? "pulsed" : "cw";
}

function SubModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className="min-w-[150px]"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function SharedFields({
  mode,
  register,
}: {
  mode: MeasurementMode;
  register: ReturnType<typeof useForm<MeasurementValues>>["register"];
}) {
  const prefix = getModePrefix(mode);
  const powerSupplyOptions = mode === "pulsed" ? pulsedPowerSupplyOptions : cwPowerSupplyOptions;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Cryostat">
        <OptionSelect options={cryostatOptions} register={register(`${prefix}Cryostat`)} />
      </FormField>
      <FormField label="Power supply">
        <OptionSelect options={powerSupplyOptions} register={register(`${prefix}PowerSupply`)} />
      </FormField>
      <FormField label="Duty cycle (%)">
        <Input type="number" step="0.1" {...register(`${prefix}DutyCycle`)} />
      </FormField>
      {mode === "pulsed" ? (
        <>
          <FormField label="Drive frequency (kHz)">
            <Input type="number" step="0.1" {...register(`${prefix}DriveFrequency`)} />
          </FormField>
          <FormField label="Gate frequency (Hz)">
            <Input type="number" step="0.1" {...register(`${prefix}GateFrequency`)} />
          </FormField>
        </>
      ) : null}
    </div>
  );
}

function ConditionalFields({
  mode,
  view,
  register,
}: {
  mode: MeasurementMode;
  view: SetupView;
  register: ReturnType<typeof useForm<MeasurementValues>>["register"];
}) {
  const prefix = getModePrefix(mode);

  if (view === "liv") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Power scale">
          <Input type="number" step="0.1" {...register(`${prefix}PowerScale`)} />
        </FormField>
        <FormField label="LIV detector">
          <OptionSelect options={detectorOptions} register={register(`${prefix}LivDetector`)} />
        </FormField>
        <FormField label="Tmax">
          <Input type="number" step="0.1" {...register(`${prefix}TMax`)} />
        </FormField>
      </div>
    );
  }

  if (view === "fixedTemperature") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tfix">
          <Input type="number" step="0.1" {...register(`${prefix}TFix`)} />
        </FormField>
        <FormField label="Spectra detector">
          <OptionSelect options={spectraDetectorOptions} register={register(`${prefix}SpectraDetector`)} />
        </FormField>
        <FormField label="Spectrometer">
          <OptionSelect options={spectrometerOptions} register={register(`${prefix}Spectrometer`)} />
        </FormField>
        <FormField label="Fmin">
          <Input type="number" step="0.01" {...register(`${prefix}FMin`)} />
        </FormField>
        <FormField label="Fmax">
          <Input type="number" step="0.01" {...register(`${prefix}FMax`)} />
        </FormField>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Ifix">
        <Input type="number" step="0.1" {...register(`${prefix}IFix`)} />
      </FormField>
      <FormField label="Spectra detector">
        <OptionSelect options={spectraDetectorOptions} register={register(`${prefix}SpectraDetector`)} />
      </FormField>
      <FormField label="Spectrometer">
        <OptionSelect options={spectrometerOptions} register={register(`${prefix}Spectrometer`)} />
      </FormField>
      <FormField label="Fmin">
        <Input type="number" step="0.01" {...register(`${prefix}FMin`)} />
      </FormField>
      <FormField label="Fmax">
        <Input type="number" step="0.01" {...register(`${prefix}FMax`)} />
      </FormField>
    </div>
  );
}

export function MeasurementSetupForm({ mode }: { mode: MeasurementMode }) {
  const navigate = useNavigate();
  const { draft, setMeasurementSetup } = useWizard();
  const [activeViews, setActiveViews] = useState<SetupView[]>(
    draft.measurementSetup[mode].enabledSections.length > 0 ? draft.measurementSetup[mode].enabledSections : ["liv"],
  );
  const cwDefaultsFromPulsed = {
    // CW starts from pulsed values when possible so the user does not retype everything.
    cryostat: draft.measurementSetup.cw.cryostat || draft.measurementSetup.pulsed.cryostat,
    livDetector: draft.measurementSetup.cw.livDetector || draft.measurementSetup.pulsed.livDetector,
    spectraDetector: draft.measurementSetup.cw.spectraDetector || draft.measurementSetup.pulsed.spectraDetector,
    powerSupply: draft.measurementSetup.cw.powerSupply || draft.measurementSetup.pulsed.powerSupply,
    spectrometer: draft.measurementSetup.cw.spectrometer || draft.measurementSetup.pulsed.spectrometer,
    powerScale: draft.measurementSetup.cw.powerScale || draft.measurementSetup.pulsed.powerScale,
    driveFrequency: draft.measurementSetup.cw.driveFrequency ?? draft.measurementSetup.pulsed.driveFrequency,
    dutyCycle: draft.measurementSetup.cw.dutyCycle ?? draft.measurementSetup.pulsed.dutyCycle,
    gateFrequency: draft.measurementSetup.cw.gateFrequency ?? draft.measurementSetup.pulsed.gateFrequency,
    tMax: draft.measurementSetup.cw.tMax ?? draft.measurementSetup.pulsed.tMax,
    fMin: draft.measurementSetup.cw.fMin ?? draft.measurementSetup.pulsed.fMin,
    fMax: draft.measurementSetup.cw.fMax ?? draft.measurementSetup.pulsed.fMax,
    tFix: draft.measurementSetup.cw.tFix ?? draft.measurementSetup.pulsed.tFix,
    iFix: draft.measurementSetup.cw.iFix ?? draft.measurementSetup.pulsed.iFix,
  };

  const form = useForm<MeasurementValues>({
    resolver: zodResolver(measurementSchema) as never,
    defaultValues: {
      pulsedCryostat: draft.measurementSetup.pulsed.cryostat,
      pulsedLivDetector: draft.measurementSetup.pulsed.livDetector,
      pulsedSpectraDetector: draft.measurementSetup.pulsed.spectraDetector,
      pulsedPowerSupply: draft.measurementSetup.pulsed.powerSupply,
      pulsedSpectrometer: draft.measurementSetup.pulsed.spectrometer,
      pulsedPowerScale: draft.measurementSetup.pulsed.powerScale,
      pulsedDriveFrequency: draft.measurementSetup.pulsed.driveFrequency,
      pulsedDutyCycle: draft.measurementSetup.pulsed.dutyCycle,
      pulsedGateFrequency: draft.measurementSetup.pulsed.gateFrequency,
      pulsedTMax: draft.measurementSetup.pulsed.tMax,
      pulsedFMin: draft.measurementSetup.pulsed.fMin,
      pulsedFMax: draft.measurementSetup.pulsed.fMax,
      pulsedTFix: draft.measurementSetup.pulsed.tFix,
      pulsedIFix: draft.measurementSetup.pulsed.iFix,
      cwCryostat: cwDefaultsFromPulsed.cryostat,
      cwLivDetector: cwDefaultsFromPulsed.livDetector,
      cwSpectraDetector: cwDefaultsFromPulsed.spectraDetector,
      cwPowerSupply: cwDefaultsFromPulsed.powerSupply,
      cwSpectrometer: cwDefaultsFromPulsed.spectrometer,
      cwPowerScale: cwDefaultsFromPulsed.powerScale,
      cwDriveFrequency: cwDefaultsFromPulsed.driveFrequency,
      cwDutyCycle: cwDefaultsFromPulsed.dutyCycle,
      cwGateFrequency: cwDefaultsFromPulsed.gateFrequency,
      cwTMax: cwDefaultsFromPulsed.tMax,
      cwFMin: cwDefaultsFromPulsed.fMin,
      cwFMax: cwDefaultsFromPulsed.fMax,
      cwTFix: cwDefaultsFromPulsed.tFix,
      cwIFix: cwDefaultsFromPulsed.iFix,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const nextPulsed = {
      cryostat: values.pulsedCryostat ?? "",
      livDetector: values.pulsedLivDetector ?? "",
      spectraDetector: values.pulsedSpectraDetector ?? "",
      powerSupply: values.pulsedPowerSupply ?? "",
      spectrometer: values.pulsedSpectrometer ?? "",
      enabledSections: mode === "pulsed" ? activeViews : draft.measurementSetup.pulsed.enabledSections,
      powerScale: values.pulsedPowerScale,
      driveFrequency: values.pulsedDriveFrequency,
      dutyCycle: values.pulsedDutyCycle,
      gateFrequency: values.pulsedGateFrequency,
      tMax: values.pulsedTMax,
      fMin: values.pulsedFMin,
      fMax: values.pulsedFMax,
      tFix: values.pulsedTFix,
      iFix: values.pulsedIFix,
    };

    const nextCw = {
      cryostat: values.cwCryostat ?? "",
      livDetector: values.cwLivDetector ?? "",
      spectraDetector: values.cwSpectraDetector ?? "",
      powerSupply: values.cwPowerSupply ?? "",
      spectrometer: values.cwSpectrometer ?? "",
      enabledSections: mode === "cw" ? activeViews : draft.measurementSetup.cw.enabledSections,
      powerScale: values.cwPowerScale,
      driveFrequency: values.cwDriveFrequency,
      dutyCycle: values.cwDutyCycle,
      gateFrequency: values.cwGateFrequency,
      tMax: values.cwTMax,
      fMin: values.cwFMin,
      fMax: values.cwFMax,
      tFix: values.cwTFix,
      iFix: values.cwIFix,
    };

    setMeasurementSetup({
      pulsed: nextPulsed,
      cw:
        mode === "pulsed"
          ? {
              // Saving pulsed first also backfills the CW defaults until the user changes them.
              ...nextCw,
              cryostat: nextCw.cryostat || nextPulsed.cryostat,
              livDetector: nextCw.livDetector || nextPulsed.livDetector,
              spectraDetector: nextCw.spectraDetector || nextPulsed.spectraDetector,
              powerSupply: nextCw.powerSupply || nextPulsed.powerSupply,
              spectrometer: nextCw.spectrometer || nextPulsed.spectrometer,
              powerScale: nextCw.powerScale || nextPulsed.powerScale,
              driveFrequency: nextCw.driveFrequency ?? nextPulsed.driveFrequency,
              dutyCycle: nextCw.dutyCycle ?? nextPulsed.dutyCycle,
              gateFrequency: nextCw.gateFrequency ?? nextPulsed.gateFrequency,
              tMax: nextCw.tMax ?? nextPulsed.tMax,
              fMin: nextCw.fMin ?? nextPulsed.fMin,
              fMax: nextCw.fMax ?? nextPulsed.fMax,
              tFix: nextCw.tFix ?? nextPulsed.tFix,
              iFix: nextCw.iFix ?? nextPulsed.iFix,
            }
          : nextCw,
    });
    const nextDraft = {
      ...draft,
      measurementSetup: {
        pulsed: nextPulsed,
        cw:
          mode === "pulsed"
            ? {
                ...nextCw,
                cryostat: nextCw.cryostat || nextPulsed.cryostat,
                livDetector: nextCw.livDetector || nextPulsed.livDetector,
                spectraDetector: nextCw.spectraDetector || nextPulsed.spectraDetector,
                powerSupply: nextCw.powerSupply || nextPulsed.powerSupply,
                spectrometer: nextCw.spectrometer || nextPulsed.spectrometer,
                powerScale: nextCw.powerScale || nextPulsed.powerScale,
                driveFrequency: nextCw.driveFrequency ?? nextPulsed.driveFrequency,
                dutyCycle: nextCw.dutyCycle ?? nextPulsed.dutyCycle,
                gateFrequency: nextCw.gateFrequency ?? nextPulsed.gateFrequency,
                tMax: nextCw.tMax ?? nextPulsed.tMax,
                fMin: nextCw.fMin ?? nextPulsed.fMin,
                fMax: nextCw.fMax ?? nextPulsed.fMax,
                tFix: nextCw.tFix ?? nextPulsed.tFix,
                iFix: nextCw.iFix ?? nextPulsed.iFix,
              }
            : nextCw,
      },
    };

    const enabledSteps = getEnabledFileSteps(nextDraft);
    // Jump straight to the first file step that actually applies to this mode.
    const firstStep = enabledSteps.find((step) => step.startsWith(mode));
    navigate(firstStep ? getFileStepHref(firstStep) : "/results");
  });

  function toggleView(view: SetupView) {
    // Setup sections can be combined, so toggling just adds or removes that block.
    setActiveViews((current) =>
      current.includes(view) ? current.filter((item) => item !== view) : [...current, view],
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <Card className="bg-[var(--color-panel)]">
        <h3 className="mb-4 text-lg font-semibold">
          {mode === "pulsed" ? "Measurement Setup (pulsed)" : "Measurement Setup (CW)"}
        </h3>
        <div className="mb-6 flex flex-wrap gap-3">
          <SubModeButton active={activeViews.includes("liv")} onClick={() => toggleView("liv")}>
            LIV
          </SubModeButton>
          <SubModeButton
            active={activeViews.includes("fixedTemperature")}
            onClick={() => toggleView("fixedTemperature")}
          >
            FTIR fixed temp
          </SubModeButton>
          <SubModeButton
            active={activeViews.includes("fixedCurrent")}
            onClick={() => toggleView("fixedCurrent")}
          >
            FTIR fixed current
          </SubModeButton>
        </div>

        <div className="grid gap-6">
          <SharedFields mode={mode} register={form.register} />
          {activeViews.includes("liv") ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/80 p-5">
              <h4 className="mb-4 text-base font-semibold">LIV</h4>
              <ConditionalFields mode={mode} view="liv" register={form.register} />
            </div>
          ) : null}
          {activeViews.includes("fixedTemperature") ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/80 p-5">
              <h4 className="mb-4 text-base font-semibold">FTIR fixed temp</h4>
              <ConditionalFields mode={mode} view="fixedTemperature" register={form.register} />
            </div>
          ) : null}
          {activeViews.includes("fixedCurrent") ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/80 p-5">
              <h4 className="mb-4 text-base font-semibold">FTIR fixed current</h4>
              <ConditionalFields mode={mode} view="fixedCurrent" register={form.register} />
            </div>
          ) : null}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">{mode === "pulsed" ? "Continue to Pulsed Files" : "Continue to CW Files"}</Button>
      </div>
    </form>
  );
}
