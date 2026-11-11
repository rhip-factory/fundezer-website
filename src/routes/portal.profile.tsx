import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal, type PatientProfile } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({
    meta: [
      { title: "My profile — FundEzer" },
      {
        name: "description",
        content:
          "Review and update your personal details, emergency contact and next of kin on FundEzer.",
      },
      { property: "og:title", content: "My profile" },
      {
        property: "og:description",
        content: "Personal details, emergency contact and next of kin.",
      },
    ],
  }),
  component: ProfilePage,
});

const groups: { title: string; fields: [keyof PatientProfile, string][] }[] = [
  {
    title: "PERSONAL DETAILS",
    fields: [
      ["fullName", "Full name"],
      ["email", "Email address"],
      ["phone", "Phone number"],
      ["nin", "National identification number"],
      ["dateOfBirth", "Date of birth"],
      ["gender", "Gender"],
      ["address", "Residential address"],
    ],
  },
  {
    title: "EMERGENCY CONTACT",
    fields: [
      ["emergencyName", "Full name"],
      ["emergencyRelation", "Relationship"],
      ["emergencyPhone", "Phone number"],
    ],
  },
  {
    title: "NEXT OF KIN",
    fields: [
      ["kinName", "Full name"],
      ["kinRelation", "Relationship"],
      ["kinPhone", "Phone number"],
    ],
  },
];

function ProfilePage() {
  const { profile, updateProfile } = usePortal();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const save = () => {
    if (!draft.fullName.trim() || !draft.email.trim() || !draft.phone.trim()) {
      toast.error("Name, email and phone number are required.");
      return;
    }
    updateProfile(draft);
    setEditing(false);
    toast.success("Your profile has been updated.");
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {profile.fullName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-card-foreground">
              {profile.fullName}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </div>
        {editing ? (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(profile);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
          >
            Edit profile
          </Button>
        )}
      </div>

      {groups.map((g) => (
        <section
          key={g.title}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {g.title}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {g.fields.map(([key, label]) => (
              <div key={key}>
                {editing ? (
                  <>
                    <Label htmlFor={key} className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <Input
                      id={key}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {profile[key] || "—"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
