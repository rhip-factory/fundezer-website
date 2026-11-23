import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Facebook, Link2, Loader2, Mail, Share2, Users, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPortalCampaign } from "@/lib/patient/campaigns.functions";
import { naira, relativeTime, usePortal } from "@/lib/patient/portal-store";

export const Route = createFileRoute("/portal/campaign")({
  head: () => ({
    meta: [
      { title: "My campaign — FundEzer" },
      {
        name: "description",
        content:
          "See how much your FundEzer campaign has raised, who has donated and share your campaign link.",
      },
      { property: "og:title", content: "My FundEzer campaign" },
      {
        property: "og:description",
        content: "Funding progress, donations and sharing for your campaign.",
      },
    ],
  }),
  component: CampaignPage,
});

function CampaignPage() {
  const { portal, isPortalLoading, portalError, hospitalName } = usePortal();
  const campaign = portal?.campaign ?? null;
  const [shareOpen, setShareOpen] = useState(false);

  const goal = campaign?.target ?? 0;
  const raised = campaign?.raised ?? 0;
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const donations = campaign?.recentDonations ?? [];
  const link = campaign?.slug
    ? `https://fundezer.app/c/${campaign.slug}`
    : "https://fundezer.app";

  const shareText = `Support ${campaign?.title ?? "this campaign"} on FundEzer`;
  const shareBody = `Hi,\n\nI’m raising funds for my treatment through FundEzer. Please consider supporting my campaign:\n\n${link}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Campaign link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: () => (
        <svg viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${link}`)}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    },
    {
      label: "X (Twitter)",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareBody)}`,
    },
  ];

  const openShare = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  if (isPortalLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Loading your campaign…</p>
      </div>
    );
  }

  if (portalError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          We could not load your campaign
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{portalError}</p>
      </div>
    );
  }

  if (!campaign) {
    return <CampaignForm />;
  }


  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          {campaign.status}
        </span>
        <h2 className="mt-3 text-xl font-semibold text-card-foreground">
          {campaign.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {campaign.hospitalName ?? hospitalName}
        </p>

        <p className="mt-5 text-3xl font-semibold text-card-foreground">
          {naira(campaign.raised)}
        </p>
        <p className="text-sm text-muted-foreground">
          raised of {naira(goal)} goal
        </p>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Funded", `${percent}%`],
            ["Donors", `${campaign.donors}`],
            ["Remaining", naira(Math.max(0, goal - raised))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-secondary/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" /> Share campaign
          </Button>
          <Button variant="outline" onClick={copyLink}>
            <Copy className="size-4" /> Copy link
          </Button>
        </div>
      </section>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this campaign</DialogTitle>
            <DialogDescription>
              Spread the word and help reach the funding goal faster.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.label}
                  onClick={() => openShare(option.href)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Icon className="size-6 text-primary" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2 text-sm text-muted-foreground">
              <Link2 className="size-4 shrink-0" />
              <span className="truncate">{link}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={copyLink}>
              <Copy className="size-4" /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
          YOUR STORY
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-card-foreground">
          {campaign.story ?? "Your story will appear here once it is published."}
        </p>
        {portal?.patient?.condition && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Treatment</p>
            <p className="mt-1 text-sm text-foreground">
              {portal.patient.condition}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
            RECENT DONATIONS
          </h3>
        </div>
        {donations.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No donations yet. Share your campaign to get started.
          </p>
        )}
        <ul className="mt-4 divide-y divide-border">
          {donations.map((d) => (
            <li
              key={d.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {d.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {relativeTime(d.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-primary">
                {naira(d.amount)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CampaignForm() {
  const { refreshPortal, hospitalName } = usePortal();
  const submit = useServerFn(submitPortalCampaign);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await submit({ data: { title, story } });
      toast.success("Campaign submitted for review");
      refreshPortal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Start your campaign</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your campaign will be reviewed by {hospitalName} and FundEzer before it goes live.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-title">Campaign title</Label>
        <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-story">Your story</Label>
        <Textarea id="c-story" rows={6} value={story} onChange={(e) => setStory(e.target.value)} required />
      </div>
      <p className="text-sm text-muted-foreground">
        The amount to raise is set by your hospital after they review your application.
      </p>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Submit campaign
      </Button>
    </form>
  );
}
