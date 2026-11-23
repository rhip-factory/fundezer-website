import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ApplyShell } from "@/components/apply-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortal, type PatientProfile } from "@/lib/patient/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply/registration")({
  head: () => ({
    meta: [
      { title: "Tell us about yourself — FundEzer" },
      {
        name: "description",
        content:
          "Provide your personal details, emergency contact and next of kin for your FundEzer sponsorship application.",
      },
      { property: "og:title", content: "Patient registration" },
      {
        property: "og:description",
        content: "A few details to create your sponsorship application.",
      },
    ],
  }),
  component: RegistrationStep,
});

type FieldKey = keyof PatientProfile;

const requiredFields: FieldKey[] = [
  "fullName",
  "email",
  "phone",
  "nin",
  "dateOfBirth",
  "gender",
  "address",
  "emergencyName",
  "emergencyPhone",
  "emergencyRelation",
  "kinName",
  "kinPhone",
  "kinRelation",
];

function Field({
  id,
  label,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  helper?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function RegistrationStep() {
  const { profile, updateProfile } = usePortal();
  const [form, setForm] = useState<PatientProfile>(profile);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const navigate = useNavigate();

  const set = (key: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submit = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    requiredFields.forEach((key) => {
      if (!form[key]?.trim()) next[key] = "Please complete this field.";
    });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please complete the highlighted fields.");
      return;
    }
    updateProfile(form);
    navigate({ to: "/apply/story" });
  };

  const inputClass = (key: FieldKey) =>
    cn(errors[key] && "border-destructive focus-visible:ring-destructive");

  return (
    <ApplyShell
      step={1}
      wide
      title="Tell us about yourself"
      description="We need a few details to create your sponsorship application."
      footer={
        <>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" asChild>
              <Link to="/apply/hospital">Back</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                updateProfile(form);
                toast.success("Application saved. You can continue later.");
              }}
            >
              Save and continue later
            </Button>
          </div>
          <Button onClick={submit}>Continue</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Section
          title="Personal information"
          description="This helps your hospital match your application to your medical records."
        >
          <Field id="fullName" label="Full name" error={errors.fullName}>
            <Input
              id="fullName"
              value={form.fullName}
              className={inputClass("fullName")}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              className={inputClass("email")}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field id="phone" label="Phone number" error={errors.phone}>
            <Input
              id="phone"
              value={form.phone}
              className={inputClass("phone")}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field
            id="nin"
            label="NIN"
            helper="Your 11-digit National Identification Number."
            error={errors.nin}
          >
            <Input
              id="nin"
              value={form.nin}
              className={inputClass("nin")}
              onChange={(e) => set("nin", e.target.value)}
            />
          </Field>
          <Field
            id="dateOfBirth"
            label="Date of birth"
            error={errors.dateOfBirth}
          >
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              className={inputClass("dateOfBirth")}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field id="gender" label="Gender" error={errors.gender}>
            <Select
              value={form.gender}
              onValueChange={(v) => set("gender", v)}
            >
              <SelectTrigger id="gender" className={inputClass("gender")}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {["Female", "Male", "Prefer not to say"].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="address" label="Residential address" error={errors.address}>
              <Input
                id="address"
                value={form.address}
                className={inputClass("address")}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Emergency contact"
          description="Someone your hospital can reach quickly if needed."
        >
          <Field id="emergencyName" label="Name" error={errors.emergencyName}>
            <Input
              id="emergencyName"
              value={form.emergencyName}
              className={inputClass("emergencyName")}
              onChange={(e) => set("emergencyName", e.target.value)}
            />
          </Field>
          <Field id="emergencyPhone" label="Phone" error={errors.emergencyPhone}>
            <Input
              id="emergencyPhone"
              value={form.emergencyPhone}
              className={inputClass("emergencyPhone")}
              onChange={(e) => set("emergencyPhone", e.target.value)}
            />
          </Field>
          <Field
            id="emergencyRelation"
            label="Relationship"
            error={errors.emergencyRelation}
          >
            <Input
              id="emergencyRelation"
              value={form.emergencyRelation}
              className={inputClass("emergencyRelation")}
              onChange={(e) => set("emergencyRelation", e.target.value)}
            />
          </Field>
        </Section>

        <Section
          title="Next of kin"
          description="Your closest family contact for treatment decisions."
        >
          <Field id="kinName" label="Full name" error={errors.kinName}>
            <Input
              id="kinName"
              value={form.kinName}
              className={inputClass("kinName")}
              onChange={(e) => set("kinName", e.target.value)}
            />
          </Field>
          <Field id="kinPhone" label="Phone" error={errors.kinPhone}>
            <Input
              id="kinPhone"
              value={form.kinPhone}
              className={inputClass("kinPhone")}
              onChange={(e) => set("kinPhone", e.target.value)}
            />
          </Field>
          <Field id="kinRelation" label="Relationship" error={errors.kinRelation}>
            <Input
              id="kinRelation"
              value={form.kinRelation}
              className={inputClass("kinRelation")}
              onChange={(e) => set("kinRelation", e.target.value)}
            />
          </Field>
        </Section>
      </div>
    </ApplyShell>
  );
}
