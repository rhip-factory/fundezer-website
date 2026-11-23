import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Heart,
  HeartHandshake,
  Home,
  Info,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Repeat2,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import fundezerLogo from "@/assets/fundezer-logo.png.asset.json";
import campaignFallback from "@/assets/campaign-amina.jpg";
import { formatNaira, walletTransactions } from "@/lib/donor-data";
import { supabase } from "@/integrations/supabase/client";
import { getPublicCampaignUpdates, listPublicCampaigns, type PublicCampaign, type PublicCampaignUpdate } from "@/lib/donor-campaigns.functions";
import {
  createDonation,
  getDonorOverview,
  markNotificationsRead,
  saveRecurringPlan,
  updateDonorProfile,
  type DonorDonation,
  type DonorNotification,
  type DonorOverview,
  type DonorRecurringPlan,
} from "@/lib/donor-hub.functions";

export const Route = createFileRoute("/_authenticated/donor")({
  head: () => ({
    meta: [
      { title: "Your donor space — FundEzer Donor Portal" },
      { name: "description", content: "Track your donations, recurring giving and campaign updates in your FundEzer donor space." },
      { property: "og:title", content: "Your donor space — FundEzer Donor Portal" },
      { property: "og:description", content: "A transparent, human-centered home for your healthcare giving journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DonorPortal,
});

type View = "dashboard" | "discover" | "donations" | "impact" | "wallet" | "recurring" | "updates" | "notifications" | "profile";
type Modal = "donate" | "fund" | "walletGive" | "transaction" | null;

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "discover", label: "Discover campaigns", icon: Search },
  { id: "donations", label: "My donations", icon: Gift },
  { id: "impact", label: "My impact", icon: TrendingUp },
  { id: "wallet", label: "Donor wallet", icon: WalletCards },
  { id: "recurring", label: "Recurring giving", icon: Repeat2 },
  { id: "updates", label: "Campaign updates", icon: Activity },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const emptyOverview: DonorOverview = {
  profile: null,
  donations: [],
  recurringPlans: [],
  notifications: [],
  totals: { given: 0, campaignsSupported: 0, paidCount: 0, pendingCount: 0 },
};

function milestonesFor(totals: DonorOverview["totals"]) {
  return [
    { title: "First Gift", copy: "You made your first FundEzer donation.", done: totals.paidCount > 0, icon: Gift },
    { title: "3 Campaigns Supported", copy: "You helped 3 people access treatment.", done: totals.campaignsSupported >= 3, icon: UsersRound },
    { title: "₦500,000 Given", copy: "Your giving has funded healthcare care.", done: totals.given >= 500000, icon: CircleDollarSign },
    { title: "First Completed Campaign", copy: "Support a campaign through completion.", done: false, icon: Target },
  ];
}

function recognitionFor(given: number) {
  if (given >= 1000000) return "FundEzer Ambassador";
  if (given >= 500000) return "Impact Champion";
  if (given >= 250000) return "Hope Builder";
  if (given >= 100000) return "Compassion Partner";
  return "Supporter";
}

function DonorPortal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<Modal>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<string | null>(null);
  const [activeDonation, setActiveDonation] = useState<DonorDonation | null>(null);
  const [walletBalance, setWalletBalance] = useState(75000);
  const [donationFilter, setDonationFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchCampaigns = useServerFn(listPublicCampaigns);
  const fetchOverview = useServerFn(getDonorOverview);
  const fetchUpdates = useServerFn(getPublicCampaignUpdates);
  const submitDonation = useServerFn(createDonation);
  const submitPlan = useServerFn(saveRecurringPlan);
  const markRead = useServerFn(markNotificationsRead);
  const saveProfile = useServerFn(updateDonorProfile);

  const campaignsQuery = useQuery({ queryKey: ["public-campaigns"], queryFn: () => fetchCampaigns() });
  const overviewQuery = useQuery({ queryKey: ["donor-overview"], queryFn: () => fetchOverview() });
  const updatesQuery = useQuery({ queryKey: ["campaign-updates"], queryFn: () => fetchUpdates({ data: {} }) });

  const campaigns = campaignsQuery.data ?? [];
  const overview = overviewQuery.data ?? emptyOverview;
  const updates = updatesQuery.data ?? [];
  const loading = campaignsQuery.isLoading || overviewQuery.isLoading;

  const donationMutation = useMutation({
    mutationFn: (input: Parameters<typeof createDonation>[0] extends never ? never : { campaignId?: string; amount: number; recurring: boolean; visibility: "Public" | "Anonymous" | "Private"; paymentMethod: string }) =>
      submitDonation({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-overview"] });
      queryClient.invalidateQueries({ queryKey: ["public-campaigns"] });
    },
  });

  const planMutation = useMutation({
    mutationFn: (input: { planId?: string; amount: number; frequency: "Weekly" | "Monthly" | "Quarterly" | "Yearly"; active: boolean }) =>
      submitPlan({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-overview"] });
      toast.success("Recurring giving saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't save that"),
  });

  const readMutation = useMutation({
    mutationFn: () => markRead({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-overview"] });
      toast.success("All notifications marked as read");
    },
  });

  const profileMutation = useMutation({
    mutationFn: (input: { fullName: string; phone?: string | undefined; city?: string | undefined; state?: string | undefined }) => saveProfile({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-overview"] });
      toast.success("Your preferences are saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't save your details"),
  });

  const donorName = overview.profile?.fullName ?? "there";
  const firstName = donorName.split(" ")[0] ?? "there";
  const initials = donorName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const unreadCount = overview.notifications.filter((item) => item.unread).length;
  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === (selectedCampaignId ?? campaigns[0]?.id)) ?? null,
    [campaigns, selectedCampaignId],
  );

  const goTo = (next: View) => {
    setCampaignDetail(null);
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setCampaignDetail(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar view={view} onNavigate={goTo} unreadCount={unreadCount} recognition={recognitionFor(overview.totals.given)} onSignOut={signOut} />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Topbar
            view={view}
            firstName={firstName}
            donorName={donorName}
            initials={initials || "FE"}
            onGive={() => setModal("donate")}
            onMenu={() => toast("Use the bottom bar to move around your donor space")}
            onNotifications={() => goTo("notifications")}
            unreadCount={unreadCount}
          />
          <div className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
            {campaignDetail ? (
              <CampaignDetail
                campaign={campaigns.find((campaign) => campaign.id === campaignDetail) ?? null}
                updates={updates.filter((update) => update.campaignId === campaignDetail)}
                onBack={() => setCampaignDetail(null)}
                onDonate={() => setModal("donate")}
              />
            ) : (
              <>
                {view === "dashboard" && (
                  <Dashboard
                    firstName={firstName}
                    campaigns={campaigns}
                    donations={overview.donations}
                    totals={overview.totals}
                    updates={updates}
                    loading={loading}
                    walletBalance={walletBalance}
                    onNavigate={goTo}
                    onCampaign={openCampaign}
                    onDonate={() => setModal("donate")}
                  />
                )}
                {view === "discover" && (
                  <Discover
                    campaigns={campaigns}
                    loading={campaignsQuery.isLoading}
                    search={search}
                    setSearch={setSearch}
                    onCampaign={openCampaign}
                    onDonate={() => setModal("donate")}
                  />
                )}
                {view === "donations" && (
                  <Donations
                    donations={overview.donations}
                    loading={overviewQuery.isLoading}
                    filter={donationFilter}
                    setFilter={setDonationFilter}
                    onDonation={(donation) => {
                      setActiveDonation(donation);
                      setModal("transaction");
                    }}
                    onDiscover={() => goTo("discover")}
                  />
                )}
                {view === "impact" && (
                  <Impact totals={overview.totals} donations={overview.donations} campaigns={campaigns} onNavigate={goTo} />
                )}
                {view === "wallet" && (
                  <Wallet
                    balance={walletBalance}
                    totals={overview.totals}
                    plan={overview.recurringPlans[0] ?? null}
                    onFund={() => setModal("fund")}
                    onGive={() => setModal("walletGive")}
                    onRecurring={() => goTo("recurring")}
                  />
                )}
                {view === "recurring" && (
                  <Recurring
                    plans={overview.recurringPlans}
                    saving={planMutation.isPending}
                    onSave={(input) => planMutation.mutate(input)}
                  />
                )}
                {view === "updates" && <Updates updates={updates} loading={updatesQuery.isLoading} onCampaign={openCampaign} />}
                {view === "notifications" && (
                  <Notifications
                    items={overview.notifications}
                    loading={overviewQuery.isLoading}
                    onMarkAll={() => readMutation.mutate()}
                  />
                )}
                {view === "profile" && (
                  <Profile
                    profile={overview.profile}
                    totals={overview.totals}
                    saving={profileMutation.isPending}
                    onSave={(input) => profileMutation.mutate(input)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <MobileNav view={view} onNavigate={goTo} onGive={() => setModal("donate")} />
      {modal === "donate" && (
        <DonationModal
          campaigns={campaigns}
          initialCampaign={selectedCampaign}
          submitting={donationMutation.isPending}
          onClose={() => setModal(null)}
          onImpact={() => {
            setModal(null);
            goTo("impact");
          }}
          onSubmit={async (input) => {
            await donationMutation.mutateAsync(input);
          }}
        />
      )}
      {modal === "fund" && (
        <FundWalletModal
          onClose={() => setModal(null)}
          onFund={(amount) => {
            setWalletBalance((balance) => balance + amount);
            setModal(null);
            toast.success(`${formatNaira(amount)} added to your wallet`, { description: "Wallet funding is not connected to payments yet." });
          }}
        />
      )}
      {modal === "walletGive" && (
        <WalletGiveModal
          balance={walletBalance}
          campaigns={campaigns}
          submitting={donationMutation.isPending}
          onClose={() => setModal(null)}
          onGive={async (amount, campaignId) => {
            try {
              await donationMutation.mutateAsync({ campaignId, amount, recurring: false, visibility: "Private", paymentMethod: "FundEzer Wallet" });
              setWalletBalance((balance) => balance - amount);
              setModal(null);
              toast.success("Your wallet gift is recorded", { description: "It stays pending until payment is confirmed." });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "We couldn't record that gift");
            }
          }}
        />
      )}
      {modal === "transaction" && activeDonation && (
        <TransactionModal
          donation={activeDonation}
          campaign={campaigns.find((campaign) => campaign.id === activeDonation.campaignId) ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Sidebar({ view, onNavigate, unreadCount, recognition, onSignOut }: { view: View; onNavigate: (view: View) => void; unreadCount: number; recognition: string; onSignOut: () => void }) {
  return <aside className="hidden w-[258px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
    <div className="flex h-[88px] items-center border-b border-border px-7">
      <button className="flex items-center gap-2.5" onClick={() => onNavigate("dashboard")} aria-label="Go to dashboard">
        <img src={fundezerLogo.url} alt="FundEzer" className="h-11 w-[112px] object-contain object-left" />
      </button>
    </div>
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your space</div>
      <nav className="space-y-1" aria-label="Donor portal navigation">
        {navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} onClick={() => onNavigate(item.id)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${active ? "bg-brand-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} aria-current={active ? "page" : undefined}><Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.3 : 1.8} /><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.id === "notifications" && unreadCount > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{unreadCount}</span>}</button>; })}
      </nav>
      <div className="my-6 border-t border-border" />
      <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account</div>
      <button onClick={() => onNavigate("profile")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${view === "profile" ? "bg-brand-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Settings className="h-[17px] w-[17px]" /><span>Profile & settings</span></button>
      <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><LogOut className="h-[17px] w-[17px]" /><span>Sign out</span></button>
      <div className="mt-auto rounded-xl bg-accent/60 p-4">
        <div className="mb-3 flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><HeartHandshake className="h-4 w-4" /></div><span className="text-xs font-semibold text-foreground">{recognition}</span></div>
        <p className="text-xs leading-5 text-muted-foreground">Your steady support is helping more people move closer to care.</p>
        <button onClick={() => onNavigate("impact")} className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">View recognition <ArrowRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
    <div className="border-t border-border px-7 py-4 text-[11px] text-muted-foreground">FundEzer Donor Portal</div>
  </aside>;
}

function Topbar({ view, firstName, donorName, initials, onGive, onMenu, onNotifications, unreadCount }: { view: View; firstName: string; donorName: string; initials: string; onGive: () => void; onMenu: () => void; onNotifications: () => void; unreadCount: number }) {
  const title = view === "dashboard" ? `Welcome back, ${firstName}` : navItems.find((item) => item.id === view)?.label ?? "Donor portal";
  const subtitle = view === "dashboard" ? "Your generosity is helping people move closer to the treatment they need." : "A clear view of your giving journey.";
  return <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur sm:px-8 lg:px-10">
    <div className="flex min-w-0 items-center gap-3"><button onClick={onMenu} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button><div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-[0.11em] text-primary">Donor space</p><h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-[21px]">{title}</h1><p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p></div></div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-4"><button onClick={onNotifications} className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}</button><div className="hidden h-7 w-px bg-border sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-primary">{initials}</div><span className="max-w-[160px] truncate text-sm font-medium text-foreground">{donorName}</span><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div><Button size="sm" onClick={onGive} className="h-9 rounded-lg px-3.5 shadow-sm"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Give now</span><span className="sm:hidden">Give</span></Button></div>
  </header>;
}

function MobileNav({ view, onNavigate, onGive }: { view: View; onNavigate: (view: View) => void; onGive: () => void }) {
  const items = navItems.slice(0, 4);
  return <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-[68px] grid-cols-5 border-t border-border bg-card/95 px-2 backdrop-blur lg:hidden"><div className="col-span-4 flex items-center justify-around">{items.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${view === item.id ? "text-primary" : "text-muted-foreground"}`}><Icon className="h-5 w-5" /><span className="truncate">{item.label.replace("Discover campaigns", "Discover").replace("My donations", "Donations").replace("My impact", "Impact")}</span></button>; })}</div><button onClick={onGive} className="my-2 flex flex-col items-center justify-center gap-1 rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground"><Plus className="h-5 w-5" />Give</button></nav>;
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) { return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">{eyebrow ?? "FundEzer"}</p><h2 className="text-[28px] font-semibold tracking-[-0.03em] text-foreground sm:text-[32px]">{title}</h2>{copy && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy}</p>}</div>{action}</div>; }

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Activity; tone: "purple" | "green" | "amber" | "blue" }) { const styles = { purple: "bg-brand-soft text-primary", green: "bg-success-soft text-success", amber: "bg-warning-soft text-warning", blue: "bg-info-soft text-info" }; return <div className="portal-surface rounded-2xl p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-3 text-[26px] font-semibold tracking-[-0.04em] tabular-nums">{value}</p></div><div className={`grid h-9 w-9 place-items-center rounded-lg ${styles[tone]}`}><Icon className="h-[17px] w-[17px]" /></div></div><p className="mt-2 text-[11px] text-muted-foreground">{detail}</p></div>; }

function Progress({ value, className = "" }: { value: number; className?: string }) { return <div className={`h-2 overflow-hidden rounded-full bg-muted ${className}`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, value)}%` }} /></div>; }

function VerificationBadge() { return <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-semibold text-success"><BadgeCheck className="h-3 w-3" /> Verified</span>; }

function SectionLabel({ children }: { children: React.ReactNode }) { return <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{children}</p>; }

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Search; title: string; copy: string }) { return <div className="portal-surface flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"><div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p></div>; }

function LoadingCards({ count = 3 }: { count?: number }) { return <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="portal-surface h-[330px] animate-pulse rounded-2xl bg-muted/40" />)}</div>; }

function CampaignCard({ campaign, onOpen, onDonate }: { campaign: PublicCampaign; onOpen: () => void; onDonate: () => void }) {
  return <article className="portal-surface group overflow-hidden rounded-2xl"><button onClick={onOpen} className="relative block h-[180px] w-full overflow-hidden bg-brand-soft text-left"><img src={campaignFallback} alt={`Approved campaign image for ${campaign.shortName}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" /><div className="absolute left-4 top-4"><VerificationBadge /></div><div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-primary-foreground"><span className="rounded-full bg-card/85 px-2 py-1 text-[10px] font-semibold text-foreground">{campaign.category}</span><span className="text-xs font-semibold">{campaign.percent}% funded</span></div></button><div className="p-5"><button onClick={onOpen} className="text-left"><h4 className="line-clamp-2 text-[15px] font-semibold leading-5 transition-colors group-hover:text-primary">{campaign.name}</h4></button><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Landmark className="h-3.5 w-3.5" /> {campaign.hospital}</p><div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{formatNaira(campaign.raised)} raised</span><span className="font-semibold text-foreground">{formatNaira(campaign.target)}</span></div><Progress value={campaign.percent} /></div><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[11px] text-muted-foreground">{campaign.updateDate ? `Latest: ${campaign.updateDate}` : campaign.condition}</span><Button size="sm" onClick={onDonate} className="h-8 rounded-lg px-3 text-xs">Support</Button></div></div></article>;
}

function Dashboard({ firstName, campaigns, donations, totals, updates, loading, walletBalance, onNavigate, onCampaign, onDonate }: { firstName: string; campaigns: PublicCampaign[]; donations: DonorDonation[]; totals: DonorOverview["totals"]; updates: PublicCampaignUpdate[]; loading: boolean; walletBalance: number; onNavigate: (view: View) => void; onCampaign: (id: string) => void; onDonate: () => void }) {
  const latestDonation = donations[0] ?? null;
  const featured = campaigns.find((campaign) => campaign.id === latestDonation?.campaignId) ?? campaigns[0] ?? null;
  const latestUpdate = updates[0] ?? null;
  const milestones = milestonesFor(totals);
  return <div className="space-y-8">
    <PageIntro eyebrow="Your giving today" title={`Welcome back, ${firstName}`} copy="Your generosity is helping people move closer to the treatment they need." action={<Button onClick={onDonate} className="rounded-lg"><Heart className="h-4 w-4" /> Give with purpose</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total given" value={formatNaira(totals.given)} detail="Confirmed contributions" icon={CircleDollarSign} tone="purple" />
      <Metric label="Campaigns supported" value={String(totals.campaignsSupported)} detail="Verified campaigns" icon={UsersRound} tone="green" />
      <Metric label="Pending gifts" value={String(totals.pendingCount)} detail="Awaiting payment confirmation" icon={Activity} tone="amber" />
      <Metric label="Public updates" value={String(updates.length)} detail="Shared by care teams" icon={Target} tone="blue" />
    </section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.8fr)]">
      <div className="portal-surface overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-4 w-4" /> Recent impact</div><h3 className="text-xl font-semibold tracking-tight">Your contribution is making a difference.</h3></div><button onClick={() => onNavigate("impact")} className="hidden items-center gap-1 text-xs font-semibold text-primary sm:flex">View my impact <ArrowRight className="h-3.5 w-3.5" /></button></div>
        {featured ? <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[250px] overflow-hidden bg-brand-soft"><img src={campaignFallback} alt="Approved campaign image" className="absolute inset-0 h-full w-full object-cover object-[30%_center]" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 text-primary-foreground"><span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-primary">{latestDonation ? "Your latest gift" : "Ready for support"}</span><p className="mt-2 text-2xl font-semibold">{latestDonation ? formatNaira(latestDonation.amount) : formatNaira(featured.target)}</p><p className="text-xs text-primary-foreground/85">{latestDonation ? `to ${latestDonation.targetName}` : featured.shortName}</p></div></div>
          <div className="flex flex-col justify-between p-5 sm:p-7"><div><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Campaign progress</span><span className="text-sm font-bold text-primary">{featured.percent}%</span></div><Progress value={featured.percent} /><p className="mt-2 text-xs text-muted-foreground">{formatNaira(featured.raised)} raised of {formatNaira(featured.target)}</p><div className="my-6 border-t border-border" /><div className="flex items-start gap-3"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success-soft text-success"><Check className="h-4 w-4" /></div><div><p className="text-sm font-semibold">{latestUpdate?.title ?? "Campaign verified for public support"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{latestUpdate?.content ?? featured.update}</p></div></div></div><div className="mt-6 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onCampaign(featured.id)} className="rounded-lg">View campaign</Button><Button size="sm" onClick={() => onNavigate("updates")} className="rounded-lg">View updates <ArrowRight className="h-3.5 w-3.5" /></Button></div></div>
        </div> : <div className="p-6"><EmptyState icon={Heart} title="No public campaigns yet" copy="Once campaigns are approved for public sharing they'll appear here." /></div>}
      </div>
      <div className="portal-surface rounded-2xl p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Your recognition</p><p className="mt-1 text-xs text-muted-foreground">Meaningful milestones along the way.</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-warning"><HeartHandshake className="h-5 w-5" /></div></div><div className="my-6 flex items-center gap-4 rounded-xl bg-accent/50 p-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-warning/25 bg-card text-warning"><Sparkles className="h-5 w-5" /></div><div><p className="font-semibold">{recognitionFor(totals.given)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Recognition for supporting healthcare campaigns.</p></div></div><div className="space-y-4">{milestones.slice(0, 3).map((item) => { const Icon = item.icon; return <div key={item.title} className="flex items-center gap-3"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{item.title}</p><p className="truncate text-[11px] text-muted-foreground">{item.done ? "Completed" : "In progress"}</p></div>{item.done && <Check className="ml-auto h-4 w-4 shrink-0 text-success" />}</div>; })}</div><button onClick={() => onNavigate("impact")} className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary">See all milestones <ArrowRight className="h-3.5 w-3.5" /></button></div>
    </section>
    <section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Verified campaigns</p><h3 className="mt-1 text-xl font-semibold tracking-tight">Campaigns you can help move forward</h3></div><button onClick={() => onNavigate("discover")} className="flex items-center gap-1 text-xs font-semibold text-primary">Discover more <ArrowRight className="h-3.5 w-3.5" /></button></div>{loading ? <LoadingCards /> : campaigns.length ? <div className="grid gap-4 lg:grid-cols-3">{campaigns.slice(0, 3).map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} onOpen={() => onCampaign(campaign.id)} onDonate={onDonate} />)}</div> : <EmptyState icon={Search} title="No campaigns are public yet" copy="Campaigns appear here as soon as they are approved and consented for public sharing." />}</section>
    <section className="portal-surface flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info"><WalletCards className="h-5 w-5" /></div><div><p className="font-semibold">Your giving balance</p><p className="mt-1 text-xs text-muted-foreground">{formatNaira(walletBalance)} available in your donor wallet</p></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onNavigate("wallet")} className="rounded-lg">Open wallet</Button><Button size="sm" onClick={onDonate} className="rounded-lg">Give now</Button></div></section>
  </div>;
}

function Discover({ campaigns, loading, search, setSearch, onCampaign, onDonate }: { campaigns: PublicCampaign[]; loading: boolean; search: string; setSearch: (value: string) => void; onCampaign: (id: string) => void; onDonate: () => void }) {
  const [filter, setFilter] = useState("All");
  const filterOptions = ["All", "Urgent", "Nearly Funded", "Recently Verified", "Recommended", "Completed"];
  const visible = campaigns.filter((campaign) => (filter === "All" || campaign.category === filter) && `${campaign.name} ${campaign.condition} ${campaign.hospital} ${campaign.location}`.toLowerCase().includes(search.toLowerCase()));
  return <div><PageIntro eyebrow="Discover with confidence" title="Find a cause worth supporting" copy="Every campaign shown here is approved for public sharing and presented with the privacy and dignity of the people it supports." action={<div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><ShieldCheck className="h-4 w-4 text-success" /> Verified campaigns only</div>} /><div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by cause, hospital or location" className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></div></div><div className="mb-7 flex gap-2 overflow-x-auto pb-1">{filterOptions.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${filter === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"}`}>{item}</button>)}</div><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{visible.length} campaigns</span> ready for support</p></div>{loading ? <LoadingCards count={6} /> : visible.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{visible.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} onOpen={() => onCampaign(campaign.id)} onDonate={() => { onCampaign(campaign.id); onDonate(); }} />)}</div> : <EmptyState icon={Search} title="No campaigns found" copy="Try a different search, clear the filter, or check back once more campaigns are published." />}</div>;
}

function CampaignDetail({ campaign, updates, onBack, onDonate }: { campaign: PublicCampaign | null; updates: PublicCampaignUpdate[]; onBack: () => void; onDonate: () => void }) {
  if (!campaign) return <div><button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back to campaigns</button><EmptyState icon={Search} title="Campaign unavailable" copy="This campaign is no longer available for public viewing." /></div>;
  return <div><button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back to campaigns</button><div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="grid lg:grid-cols-[1.05fr_0.95fr]"><div className="relative min-h-[320px] bg-brand-soft lg:min-h-[500px]"><img src={campaignFallback} alt={`Approved campaign image for ${campaign.shortName}`} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 right-6 text-primary-foreground sm:left-9 sm:right-9"><VerificationBadge /><p className="mt-3 text-xs font-medium text-primary-foreground/80">{campaign.hospital} · {campaign.location}</p><h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight sm:text-4xl">{campaign.name}</h2></div></div><div className="flex flex-col justify-center p-6 sm:p-9"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{campaign.percent}% funded</span><span className="text-xs text-muted-foreground">{formatNaira(campaign.raised)} of {formatNaira(campaign.target)}</span></div><Progress value={campaign.percent} className="mt-3 h-3" /><div className="mt-8 grid grid-cols-2 gap-4"><div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Treatment stage</p><p className="mt-2 text-sm font-semibold">{campaign.stage}</p></div><div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Latest update</p><p className="mt-2 text-sm font-semibold">{campaign.updateDate || "Not yet shared"}</p></div></div><Button onClick={onDonate} className="mt-8 h-12 w-full rounded-lg text-base"><Heart className="h-4 w-4" /> Donate now</Button><p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">Your donation visibility can be public, anonymous, or private.</p></div></div><div className="grid gap-8 border-t border-border p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr]"><div><SectionLabel>Patient story</SectionLabel><h3 className="mt-2 text-xl font-semibold">Care, shared with dignity</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{campaign.story}</p><div className="mt-7"><SectionLabel>Treatment information</SectionLabel><div className="mt-3 flex items-start gap-3 rounded-xl bg-info-soft p-4"><Info className="mt-0.5 h-4 w-4 shrink-0 text-info" /><div><p className="text-sm font-semibold">{campaign.condition}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Approved summary: care coordinated through {campaign.hospital}.</p></div></div></div></div><div><SectionLabel>Treatment updates</SectionLabel>{updates.length ? <div className="mt-4 space-y-5">{updates.map((update, index) => <div key={update.id} className="relative flex gap-3"><div className="relative flex flex-col items-center"><div className={`z-10 grid h-7 w-7 place-items-center rounded-full ${index === 0 ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{index === 0 ? <Check className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}</div>{index < updates.length - 1 && <div className="absolute top-7 h-full w-px bg-border" />}</div><div className="pb-3"><p className="text-xs text-muted-foreground">{update.publishedAt ? new Date(update.publishedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p><p className="mt-1 text-sm font-semibold">{update.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{update.content}</p></div></div>)}</div> : <p className="mt-4 text-sm leading-6 text-muted-foreground">No public updates have been shared for this campaign yet. Care teams publish updates only with consent.</p>}</div></div></div></div>;
}

function Donations({ donations, loading, filter, setFilter, onDonation, onDiscover }: { donations: DonorDonation[]; loading: boolean; filter: string; setFilter: (filter: string) => void; onDonation: (donation: DonorDonation) => void; onDiscover: () => void }) {
  const options = ["All", "One-time", "Recurring", "Paid", "Pending"];
  const rows = donations.filter((donation) => filter === "All" || donation.type === filter || donation.status === filter);
  return <div><PageIntro eyebrow="Your giving history" title="My donations" copy="A clear record of every gift, with the campaign it supports." action={<Button className="rounded-lg" onClick={onDiscover}>Make a donation <ArrowRight className="h-4 w-4" /></Button>} /><div className="mb-5 flex gap-2 overflow-x-auto pb-1">{options.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${filter === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{item}</button>)}</div>{loading ? <div className="portal-surface h-64 animate-pulse rounded-2xl bg-muted/40" /> : rows.length ? <div className="portal-surface overflow-hidden rounded-2xl"><div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.7fr_32px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid"><span>Date</span><span>Campaign</span><span>Amount</span><span>Type</span><span>Status</span><span /></div>{rows.map((donation) => <button key={donation.id} onClick={() => onDonation(donation)} className="grid w-full gap-2 border-b border-border px-5 py-4 text-left transition-colors last:border-0 hover:bg-muted/45 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.7fr_32px] md:items-center md:gap-4"><div><p className="text-xs font-medium text-muted-foreground md:text-sm">{donation.date}</p></div><div className="flex items-center gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary"><Heart className="h-3.5 w-3.5" /></div><span className="truncate text-sm font-semibold">{donation.targetName}</span></div><span className="text-sm font-bold tabular-nums">{formatNaira(donation.amount)}</span><span className="text-xs text-muted-foreground">{donation.type}</span><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-semibold ${donation.status === "Paid" ? "bg-success-soft text-success" : "bg-info-soft text-info"}`}>{donation.status}</span><ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" /></button>)}</div> : <EmptyState icon={Gift} title="No donations yet" copy="When you support a campaign, your gift will appear here with its status and impact." />}<p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Only you can see your donation history.</p></div>;
}

function Impact({ totals, donations, campaigns, onNavigate }: { totals: DonorOverview["totals"]; donations: DonorDonation[]; campaigns: PublicCampaign[]; onNavigate: (view: View) => void }) {
  const milestones = milestonesFor(totals);
  const latest = donations[0] ?? null;
  const campaign = campaigns.find((item) => item.id === latest?.campaignId) ?? null;
  const timeline: { label: string; title: string; detail: string; style: string; icon: typeof Activity }[] = [
    { label: "Donation", title: latest ? `${formatNaira(latest.amount)} donated` : "No donation yet", detail: latest?.date ?? "Your first gift will appear here", style: "bg-brand-soft text-primary", icon: CircleDollarSign },
    { label: "Campaign", title: latest?.targetName ?? "Choose a campaign", detail: campaign ? `${campaign.percent}% of target reached` : "Progress appears once linked", style: "bg-info-soft text-info", icon: Heart },
    { label: "Treatment progress", title: campaign?.stage ?? "Awaiting care team update", detail: "Latest recorded stage", style: "bg-success-soft text-success", icon: Check },
    { label: "Hospital update", title: campaign?.update ?? "No public update shared yet", detail: campaign?.updateDate || "Updates are shared with consent", style: "bg-warning-soft text-warning", icon: Activity },
  ];
  return <div><PageIntro eyebrow="The difference you make" title="My impact" copy="Your giving is more than a transaction. Follow the moments of progress it helps make possible." action={<div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-xs font-semibold text-success"><ShieldCheck className="h-4 w-4" /> Privacy-safe by design</div>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total donated" value={formatNaira(totals.given)} detail={`Across ${totals.paidCount} confirmed gifts`} icon={CircleDollarSign} tone="purple" /><Metric label="Campaigns supported" value={String(totals.campaignsSupported)} detail="Verified campaigns" icon={UsersRound} tone="green" /><Metric label="Pending gifts" value={String(totals.pendingCount)} detail="Awaiting confirmation" icon={Heart} tone="amber" /><Metric label="Recognition" value={recognitionFor(totals.given)} detail="Visual recognition only" icon={Target} tone="blue" /></section><section className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><div className="portal-surface rounded-2xl p-6 sm:p-8"><SectionLabel>Your giving in motion</SectionLabel><h3 className="mt-2 text-xl font-semibold">{latest?.targetName ?? "Start your giving journey"}</h3><p className="mt-1 text-sm text-muted-foreground">A clear path from your gift to a treatment milestone.</p><div className="mt-8 space-y-0">{timeline.map((item, index) => { const Icon = item.icon; return <div key={item.label} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex flex-col items-center"><div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.style}`}><Icon className="h-4 w-4" /></div>{index < timeline.length - 1 && <div className="absolute top-10 h-full w-px bg-border" />}</div><div className="min-w-0 pt-1"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p><p className="mt-1 text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div></div>; })}</div></div><div className="space-y-5"><div className="portal-surface rounded-2xl p-6"><SectionLabel>Recognition milestones</SectionLabel><div className="mt-5 space-y-4">{milestones.map((item) => { const Icon = item.icon; return <div key={item.title} className={`flex items-center gap-3 rounded-xl border p-3 ${item.done ? "border-success/20 bg-success-soft/35" : "border-border bg-card"}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-4 text-muted-foreground">{item.copy}</p></div>{item.done ? <Check className="h-4 w-4 shrink-0 text-success" /> : <span className="text-[10px] font-semibold text-muted-foreground">Next</span>}</div>; })}</div></div><div className="portal-surface rounded-2xl bg-primary p-6 text-primary-foreground"><div className="flex items-start justify-between"><div><SectionLabel>{recognitionFor(totals.given)}</SectionLabel><h3 className="mt-2 text-xl font-semibold">You’re helping build a culture of care.</h3></div><HeartHandshake className="h-7 w-7 opacity-80" /></div><p className="mt-3 text-sm leading-6 text-primary-foreground/80">Recognition is a way to honour your consistency. It never affects patient eligibility or access to treatment.</p><Button variant="secondary" size="sm" onClick={() => onNavigate("recurring")} className="mt-5 rounded-lg">Continue giving <ArrowRight className="h-3.5 w-3.5" /></Button></div></div></section></div>;
}

function Wallet({ balance, totals, plan, onFund, onGive, onRecurring }: { balance: number; totals: DonorOverview["totals"]; plan: DonorRecurringPlan | null; onFund: () => void; onGive: () => void; onRecurring: () => void }) {
  return <div><PageIntro eyebrow="Your giving balance" title="Donor wallet" copy="Keep a flexible balance ready for the campaigns that matter to you. Separate from every campaign's own care fund." action={<Button onClick={onFund} className="rounded-lg"><Plus className="h-4 w-4" /> Fund wallet</Button>} /><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-primary p-6 text-primary-foreground md:col-span-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground/70">Available giving balance</p><WalletCards className="h-5 w-5 opacity-80" /></div><p className="mt-5 text-4xl font-semibold tracking-[-0.04em] tabular-nums">{formatNaira(balance)}</p><p className="mt-2 text-xs text-primary-foreground/70">Ready for your next gift</p><div className="mt-6 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={onGive} className="rounded-lg">Give from wallet <ArrowUpRight className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={onFund} className="rounded-lg text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Add funds</Button></div></div><Metric label="Recurring commitment" value={plan ? formatNaira(plan.amount) : "Not set"} detail={plan?.nextRunOn ? `Next on ${new Date(plan.nextRunOn).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}` : "Set up recurring giving"} icon={Repeat2} tone="amber" /><Metric label="Total given" value={formatNaira(totals.given)} detail={`${totals.paidCount} contributions`} icon={CircleDollarSign} tone="purple" /></section><section className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><div className="portal-surface overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-7"><div><h3 className="text-lg font-semibold">Wallet activity</h3><p className="mt-1 text-xs text-muted-foreground">Sample activity — wallet payments are not connected yet</p></div></div><div>{walletTransactions.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-0 sm:px-7"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${transaction.kind === "credit" ? "bg-success-soft text-success" : "bg-brand-soft text-primary"}`}>{transaction.kind === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{transaction.label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{transaction.date} · {transaction.reference}</p></div><div className="text-right"><p className={`text-sm font-bold tabular-nums ${transaction.kind === "credit" ? "text-success" : "text-foreground"}`}>{transaction.kind === "credit" ? "+" : "−"}{formatNaira(transaction.amount)}</p><p className="mt-1 text-[11px] text-muted-foreground">Bal. {formatNaira(transaction.balance)}</p></div></div>)}</div></div><div className="portal-surface rounded-2xl p-6"><SectionLabel>Make giving easier</SectionLabel><h3 className="mt-2 text-lg font-semibold">Your wallet, your rhythm.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep recurring giving organized and choose how you want to support campaigns.</p><div className="mt-6 space-y-2"><Button variant="outline" onClick={onRecurring} className="w-full justify-between rounded-lg">Manage recurring giving <ArrowRight className="h-4 w-4" /></Button><button onClick={() => toast("Auto top-up is planned for a later phase")} className="flex w-full items-center justify-between rounded-lg border border-dashed border-border p-3 text-left text-xs text-muted-foreground hover:bg-muted"><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Auto top-up <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">Later</span></span><ChevronDown className="h-3.5 w-3.5" /></button></div><div className="mt-6 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-xs leading-5 text-info"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Donor wallet and campaign wallet are always kept separate.</div></div></section></div>;
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) { return <div className="flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">{label}</span>{hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}</div>; }

function Recurring({ plans, saving, onSave }: { plans: DonorRecurringPlan[]; saving: boolean; onSave: (input: { planId?: string; amount: number; frequency: "Weekly" | "Monthly" | "Quarterly" | "Yearly"; active: boolean }) => void }) {
  const current = plans[0] ?? null;
  const [amount, setAmount] = useState(String(current?.amount ?? 25000));
  const [frequency, setFrequency] = useState<"Weekly" | "Monthly" | "Quarterly" | "Yearly">((current?.frequency as "Monthly") ?? "Monthly");
  const [allocation, setAllocation] = useState("I Choose");
  const [enabled, setEnabled] = useState(current ? current.status === "Active" : true);
  return <div><PageIntro eyebrow="Keep showing up" title="Recurring giving" copy="A simple way to create steady support while staying in control of how your contribution is allocated." action={<span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-2 text-xs font-semibold text-success"><span className="h-2 w-2 rounded-full bg-success" /> {current ? current.status : "Not set up"}</span>} /><div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]"><div className="portal-surface rounded-2xl p-6 sm:p-8"><div className="flex items-start justify-between border-b border-border pb-6"><div><h3 className="text-xl font-semibold">Configure your giving</h3><p className="mt-1 text-sm text-muted-foreground">You can pause or change this anytime.</p></div><button onClick={() => setEnabled(!enabled)} className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`} aria-label="Toggle recurring giving"><span className={`absolute top-1 h-4 w-4 rounded-full bg-card transition-transform ${enabled ? "left-6" : "left-1"}`} /></button></div><div className="mt-7 space-y-7"><FieldLabel label="Contribution amount" hint="Naira per contribution" /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[10000, 25000, 50000, 100000].map((value) => <button key={value} onClick={() => setAmount(String(value))} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${amount === String(value) ? "border-primary bg-brand-soft text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>{formatNaira(value)}</button>)}</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} className="h-11 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring" aria-label="Contribution amount" /></div><div><FieldLabel label="Frequency" /><div className="mt-3 grid grid-cols-3 gap-2">{(["Weekly", "Monthly", "Quarterly"] as const).map((value) => <button key={value} onClick={() => setFrequency(value)} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${frequency === value ? "border-primary bg-brand-soft text-primary" : "border-border bg-card text-muted-foreground"}`}>{value}</button>)}</div></div><div><FieldLabel label="How should we allocate it?" hint="Automated allocation always requires your consent." /><div className="mt-3 space-y-2">{[["I Choose", "Manually select campaigns when you’re ready."], ["FundEzer Recommends", "Support verified campaigns using your criteria."], ["Emergency Support", "Support campaigns classified as urgent."], ["Equal Support", "Divide your contribution across selected campaigns."]].map(([value, description]) => <button key={value} onClick={() => setAllocation(value as string)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${allocation === value ? "border-primary bg-brand-soft/60" : "border-border bg-card"}`}><div className={`mt-0.5 grid h-4 w-4 place-items-center rounded-full border ${allocation === value ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{allocation === value && <Check className="h-3 w-3" />}</div><div><p className="text-sm font-semibold">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></button>)}</div></div><div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Your scheduled contribution runs once payments are connected. Only "I Choose" allocation is applied today.</div><Button disabled={saving || Number(amount) <= 0} onClick={() => onSave({ ...(current ? { planId: current.id } : {}), amount: Number(amount), frequency, active: enabled })} className="w-full rounded-lg">Save recurring preference <Check className="h-4 w-4" /></Button></div></div><div className="space-y-5"><div className="portal-surface rounded-2xl p-6"><SectionLabel>Your current plans</SectionLabel>{plans.length ? <div className="mt-5 space-y-4">{plans.map((plan) => <div key={plan.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-semibold tabular-nums">{formatNaira(plan.amount)}</p><p className="mt-1 text-xs text-muted-foreground">{plan.frequency} · {plan.nextRunOn ? `Next ${new Date(plan.nextRunOn).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}` : "No date set"}</p></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary"><Repeat2 className="h-5 w-5" /></div></div><span className={`mt-3 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${plan.status === "Active" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{plan.status}</span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-muted-foreground">You don’t have a recurring plan yet. Set one up on the left.</p>}</div><div className="rounded-2xl bg-accent p-6"><div className="flex gap-3"><HeartHandshake className="h-5 w-5 shrink-0 text-warning" /><div><p className="text-sm font-semibold">Consistency creates confidence</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Your recurring support helps campaigns plan the next step with more certainty.</p></div></div></div></div></div></div>;
}

function Updates({ updates, loading, onCampaign }: { updates: PublicCampaignUpdate[]; loading: boolean; onCampaign: (id: string) => void }) {
  return <div><PageIntro eyebrow="Stay connected" title="Campaign updates" copy="Privacy-safe updates published by care teams, so you can see progress without exposing sensitive details." /><div className="space-y-4">{loading ? <div className="portal-surface h-40 animate-pulse rounded-2xl bg-muted/40" /> : updates.length ? updates.map((update, index) => <article key={update.id} className="portal-surface overflow-hidden rounded-2xl"><div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6"><div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:h-24 sm:w-36"><img src={campaignFallback} alt="Approved campaign image" loading="lazy" className="h-full w-full object-cover" /><div className="absolute left-2 top-2"><VerificationBadge /></div></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">{index === 0 ? "New update" : "Campaign update"}</span><span className="text-[11px] text-muted-foreground">· {update.publishedAt ? new Date(update.publishedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "Recently"}</span></div><h3 className="mt-2 text-lg font-semibold">{update.title}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{update.content}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{update.campaignName} · only approved, privacy-safe information is shown.</p></div><Button variant="outline" size="sm" onClick={() => onCampaign(update.campaignId)} className="shrink-0 rounded-lg">View campaign <ArrowRight className="h-3.5 w-3.5" /></Button></div></article>) : <EmptyState icon={Activity} title="No public updates yet" copy="Care teams publish updates with consent. They'll appear here as soon as they're shared." />}</div></div>;
}

function Notifications({ items, loading, onMarkAll }: { items: DonorNotification[]; loading: boolean; onMarkAll: () => void }) {
  return <div><PageIntro eyebrow="Stay in the loop" title="Notifications" copy="Important updates from your donations, wallet, and recurring giving." action={items.length ? <Button variant="outline" onClick={onMarkAll} className="rounded-lg">Mark all as read <Check className="h-4 w-4" /></Button> : undefined} />{loading ? <div className="portal-surface h-48 animate-pulse rounded-2xl bg-muted/40" /> : items.length ? <div className="portal-surface overflow-hidden rounded-2xl">{items.map((item) => <div key={item.id} className={`flex gap-4 border-b border-border p-5 last:border-0 sm:p-6 ${item.unread ? "bg-brand-soft/25" : ""}`}><div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary"><Bell className="h-4 w-4" />{item.unread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{item.title}</h3>{item.unread && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary">New</span>}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{item.type} · {item.time}</p></div><button className="self-start text-muted-foreground" aria-label="More notification options"><MoreHorizontal className="h-4 w-4" /></button></div>)}</div> : <EmptyState icon={Bell} title="Nothing new right now" copy="Donation confirmations, campaign updates and recurring giving alerts will appear here." />}</div>;
}

function SettingRow({ label, detail }: { label: string; detail: string }) { return <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"><span className="text-sm font-medium">{label}</span><span className="text-xs font-semibold text-primary">{detail}</span></div>; }

function Profile({ profile, totals, saving, onSave }: { profile: DonorOverview["profile"]; totals: DonorOverview["totals"]; saving: boolean; onSave: (input: { fullName: string; phone?: string | undefined; city?: string | undefined; state?: string | undefined }) => void }) {
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const initials = (fullName || "FE").split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <div><PageIntro eyebrow="Your preferences" title="Profile & settings" copy="Keep your donor details and communication choices up to date. Your private information stays private." /><div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]"><div className="space-y-5"><div className="portal-surface rounded-2xl p-6 sm:p-8"><SectionLabel>Personal information</SectionLabel><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-semibold">Full name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label><label className="space-y-2"><span className="text-xs font-semibold">Email address</span><input value={profile?.email ?? ""} readOnly className="h-11 w-full rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground outline-none" /></label><label className="space-y-2"><span className="text-xs font-semibold">Phone number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label><label className="space-y-2"><span className="text-xs font-semibold">City</span><input value={city} onChange={(event) => setCity(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label><label className="space-y-2"><span className="text-xs font-semibold">State</span><input value={state} onChange={(event) => setState(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label></div><Button disabled={saving || fullName.trim().length < 2} onClick={() => onSave({ fullName: fullName.trim(), phone: phone || undefined, city: city || undefined, state: state || undefined })} className="mt-6 rounded-lg">Save changes</Button></div><div className="portal-surface rounded-2xl p-6 sm:p-8"><SectionLabel>Donation preferences</SectionLabel><div className="mt-5 space-y-4"><SettingRow label="Total given" detail={formatNaira(totals.given)} /><SettingRow label="Default donation visibility" detail="Private" /><SettingRow label="Campaigns supported" detail={String(totals.campaignsSupported)} /></div></div></div><div className="space-y-5"><div className="portal-surface rounded-2xl p-6"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-sm font-bold text-primary">{initials}</div><div><p className="font-semibold">{fullName || "Your donor profile"}</p><p className="mt-1 text-xs text-muted-foreground">{recognitionFor(totals.given)}</p></div></div></div><div className="rounded-2xl bg-info-soft p-6"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-info" /><div><h3 className="text-sm font-semibold">Your privacy matters</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Your email, phone, payment details, address, and financial information are never publicly displayed. You decide whether each donation is public, anonymous, or private.</p></div></div></div><div className="portal-surface rounded-2xl p-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-warning"><Gift className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold">Help someone else make an impact</h3><p className="mt-1 text-xs text-muted-foreground">Your referrals contribute to recognition, never cash commissions.</p></div></div><div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2"><span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">fundezer.org/invite</span><button onClick={() => { navigator.clipboard?.writeText("fundezer.org/invite"); toast.success("Referral link copied"); }} aria-label="Copy referral link" className="shrink-0 text-primary"><Copy className="h-4 w-4" /></button></div></div></div></div></div>;
}

function ModalShell({ title, copy, onClose, children }: { title: string; copy?: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl border border-border bg-card shadow-2xl sm:max-w-[560px] sm:rounded-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-5 py-5 sm:px-7"><div><h2 className="text-xl font-semibold tracking-tight">{title}</h2>{copy && <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>}</div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button></div><div className="p-5 sm:p-7">{children}</div></div></div>; }

function ModalActions({ onBack, onNext }: { onBack: () => void; onNext: () => void }) { return <div className="mt-6 flex gap-2"><Button variant="outline" onClick={onBack} className="flex-1 rounded-lg">Back</Button><Button onClick={onNext} className="flex-1 rounded-lg">Continue <ArrowRight className="h-4 w-4" /></Button></div>; }

function DonationModal({ campaigns, initialCampaign, submitting, onClose, onImpact, onSubmit }: { campaigns: PublicCampaign[]; initialCampaign: PublicCampaign | null; submitting: boolean; onClose: () => void; onImpact: () => void; onSubmit: (input: { campaignId: string; amount: number; recurring: boolean; visibility: "Public" | "Anonymous" | "Private"; paymentMethod: string }) => Promise<void> }) {
  const [step, setStep] = useState(initialCampaign ? 1 : 0);
  const [campaignId, setCampaignId] = useState(initialCampaign?.id ?? "");
  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [visibility, setVisibility] = useState<"Public" | "Anonymous" | "Private">("Private");
  const [method, setMethod] = useState("Card");
  const campaign = campaigns.find((item) => item.id === campaignId) ?? null;
  const finalAmount = custom ? Number(custom) : amount;

  const confirm = async () => {
    if (!campaign || finalAmount <= 0) return;
    try {
      await onSubmit({ campaignId: campaign.id, amount: finalAmount, recurring, visibility, paymentMethod: method });
      setStep(5);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't record your donation");
    }
  };

  if (step === 5) return <ModalShell title="Your contribution is in motion" onClose={onClose}><div className="flex flex-col items-center py-4 text-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success"><Check className="h-8 w-8" /></div><h3 className="mt-5 text-2xl font-semibold tracking-tight">You’re helping someone move closer to treatment.</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Your {formatNaira(finalAmount)} contribution to {campaign?.shortName} has been recorded and stays pending until payment is confirmed.</p><div className="my-6 grid w-full grid-cols-2 gap-3"><div className="rounded-xl bg-muted p-4 text-left"><p className="text-xs text-muted-foreground">Amount</p><p className="mt-1 text-lg font-semibold">{formatNaira(finalAmount)}</p></div><div className="rounded-xl bg-info-soft p-4 text-left"><p className="text-xs text-info">Status</p><p className="mt-1 text-lg font-semibold text-info">Pending</p></div></div><div className="flex w-full flex-col gap-2 sm:flex-row"><Button onClick={onImpact} className="flex-1 rounded-lg">See my impact <ArrowRight className="h-4 w-4" /></Button><Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">Discover more campaigns</Button></div></div></ModalShell>;

  return <ModalShell title="Make a meaningful gift" copy={campaign ? `Supporting ${campaign.shortName}` : "Choose a campaign to support"} onClose={onClose}>
    {step === 0 && <div><p className="mb-3 text-sm font-semibold">Choose a campaign</p>{campaigns.length ? <div className="space-y-2">{campaigns.slice(0, 6).map((item) => <button key={item.id} onClick={() => { setCampaignId(item.id); setStep(1); }} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/50"><img src={campaignFallback} alt="" className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.shortName}</p><p className="mt-1 text-xs text-muted-foreground">{item.condition} · {item.percent}% funded</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></button>)}</div> : <p className="text-sm leading-6 text-muted-foreground">No campaigns are publicly available yet, so a gift can't be recorded right now.</p>}</div>}
    {step > 0 && <div className="mb-6 flex items-center gap-1">{["Amount", "Frequency", "Visibility", "Payment"].map((label, index) => <div key={label} className="flex min-w-0 flex-1 items-center gap-1"><div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${step > index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > index ? <Check className="h-3 w-3" /> : index + 1}</div><span className={`hidden truncate text-[10px] font-medium sm:block ${step === index + 1 ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>{index < 3 && <div className="h-px min-w-2 flex-1 bg-border" />}</div>)}</div>}
    {step === 1 && <div><p className="mb-3 text-sm font-semibold">Choose an amount</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[5000, 10000, 25000, 50000].map((value) => <button key={value} onClick={() => { setAmount(value); setCustom(""); }} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${amount === value && !custom ? "border-primary bg-brand-soft text-primary" : "border-border text-muted-foreground"}`}>{formatNaira(value)}</button>)}</div><div className="relative mt-3"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span><input value={custom} onChange={(event) => setCustom(event.target.value.replace(/\D/g, ""))} placeholder="Enter a custom amount" className="h-11 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><Button disabled={finalAmount <= 0} onClick={() => setStep(2)} className="mt-6 w-full rounded-lg">Continue <ArrowRight className="h-4 w-4" /></Button></div>}
    {step === 2 && <div><p className="mb-3 text-sm font-semibold">How often would you like to give?</p><div className="space-y-2">{([[false, "One-time", "A single contribution to this campaign"], [true, "Recurring", "Keep supporting this campaign on a schedule"]] as const).map(([value, label, description]) => <button key={label} onClick={() => setRecurring(value)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${recurring === value ? "border-primary bg-brand-soft/60" : "border-border"}`}><div className={`mt-0.5 grid h-4 w-4 place-items-center rounded-full border ${recurring === value ? "border-primary bg-primary" : "border-input"}`}>{recurring === value && <div className="h-1.5 w-1.5 rounded-full bg-card" />}</div><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></button>)}</div><ModalActions onBack={() => setStep(1)} onNext={() => setStep(3)} /></div>}
    {step === 3 && <div><p className="mb-3 text-sm font-semibold">Choose donation visibility</p><div className="space-y-2">{(["Public", "Anonymous", "Private"] as const).map((value) => <button key={value} onClick={() => setVisibility(value)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${visibility === value ? "border-primary bg-brand-soft/60" : "border-border"}`}><div className={`mt-0.5 grid h-4 w-4 place-items-center rounded-full border ${visibility === value ? "border-primary bg-primary" : "border-input"}`}>{visibility === value && <div className="h-1.5 w-1.5 rounded-full bg-card" />}</div><div><p className="text-sm font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{value === "Public" ? "Your name appears alongside your support" : value === "Anonymous" ? "Your support is visible without your name" : "Only you and FundEzer can see this gift"}</p></div></button>)}</div><ModalActions onBack={() => setStep(2)} onNext={() => setStep(4)} /></div>}
    {step === 4 && <div><p className="mb-3 text-sm font-semibold">Select a payment method</p><div className="space-y-2">{([["FundEzer Wallet", "Give from your donor balance", CreditCard], ["Card", "Pay with your card", CreditCard], ["Bank transfer", "You’ll receive payment instructions", Landmark]] as const).map(([label, description, Icon]) => <button key={label} onClick={() => setMethod(label)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${method === label ? "border-primary bg-brand-soft/60" : "border-border"}`}><div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></div><div className="flex-1"><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>{method === label && <Check className="h-4 w-4 text-primary" />}</button>)}</div><div className="mt-5 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-xs leading-5 text-info"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Payments aren’t processed yet, so your gift is saved as pending until it’s confirmed.</div><div className="mt-6 flex gap-2"><Button variant="outline" onClick={() => setStep(3)} className="flex-1 rounded-lg">Back</Button><Button disabled={submitting} onClick={confirm} className="flex-1 rounded-lg">{submitting ? "Saving…" : `Confirm ${formatNaira(finalAmount)}`}</Button></div></div>}
  </ModalShell>;
}

function FundWalletModal({ onClose, onFund }: { onClose: () => void; onFund: (amount: number) => void }) {
  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState("");
  const finalAmount = custom ? Number(custom) : amount;
  return <ModalShell title="Fund your donor wallet" copy="Add balance for quick, flexible giving." onClose={onClose}><p className="mb-3 text-sm font-semibold">How much would you like to add?</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[10000, 25000, 50000, 100000].map((value) => <button key={value} onClick={() => { setAmount(value); setCustom(""); }} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${amount === value && !custom ? "border-primary bg-brand-soft text-primary" : "border-border text-muted-foreground"}`}>{formatNaira(value)}</button>)}</div><input value={custom} onChange={(event) => setCustom(event.target.value.replace(/\D/g, ""))} placeholder="Custom amount" className="mt-3 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><div className="mt-5 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-xs leading-5 text-warning"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Wallet funding isn’t connected to payments yet, so this only updates your view.</div><Button disabled={finalAmount <= 0} onClick={() => onFund(finalAmount)} className="mt-6 w-full rounded-lg">Add {formatNaira(finalAmount)} <ArrowRight className="h-4 w-4" /></Button></ModalShell>;
}

function WalletGiveModal({ balance, campaigns, submitting, onClose, onGive }: { balance: number; campaigns: PublicCampaign[]; submitting: boolean; onClose: () => void; onGive: (amount: number, campaignId: string) => void }) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [amount, setAmount] = useState(10000);
  return <ModalShell title="Give from your wallet" copy={`Available balance: ${formatNaira(balance)}`} onClose={onClose}><p className="mb-3 text-sm font-semibold">Choose a campaign</p>{campaigns.length ? <><div className="space-y-2">{campaigns.slice(0, 4).map((campaign) => <button key={campaign.id} onClick={() => setCampaignId(campaign.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${campaignId === campaign.id ? "border-primary bg-brand-soft/60" : "border-border"}`}><img src={campaignFallback} alt="" className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{campaign.shortName}</p><p className="mt-1 text-xs text-muted-foreground">{campaign.condition} · {campaign.percent}% funded</p></div>{campaignId === campaign.id && <Check className="h-4 w-4 text-primary" />}</button>)}</div><p className="mb-3 mt-6 text-sm font-semibold">Choose an amount</p><div className="grid grid-cols-3 gap-2">{[10000, 25000, 50000].map((value) => <button key={value} onClick={() => setAmount(value)} className={`rounded-lg border px-2 py-3 text-sm font-semibold ${amount === value ? "border-primary bg-brand-soft text-primary" : "border-border text-muted-foreground"}`}>{formatNaira(value)}</button>)}</div><div className="mt-5 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-xs leading-5 text-info"><WalletCards className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Your wallet view will show {formatNaira(Math.max(0, balance - amount))} after confirmation. The gift stays pending until payment is confirmed.</div><Button disabled={submitting || amount > balance || !campaignId} onClick={() => onGive(amount, campaignId)} className="mt-6 w-full rounded-lg">{submitting ? "Saving…" : "Confirm gift"} <ArrowRight className="h-4 w-4" /></Button></> : <p className="text-sm leading-6 text-muted-foreground">No campaigns are publicly available yet.</p>}</ModalShell>;
}

function TransactionModal({ donation, campaign, onClose }: { donation: DonorDonation; campaign: PublicCampaign | null; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Donation reference", donation.id.slice(0, 8).toUpperCase()],
    ["Payment method", donation.method],
    ["Visibility", donation.visibility],
    ["Type", donation.type],
    ["Campaign progress", campaign ? `${campaign.percent}% funded` : "Not publicly shared"],
    ["Latest update", campaign?.update ?? "No public update shared yet"],
  ];
  return <ModalShell title="Donation details" copy="A complete record of your contribution." onClose={onClose}><div className={`rounded-xl p-4 ${donation.status === "Paid" ? "bg-success-soft" : "bg-info-soft"}`}><div className={`flex items-center gap-2 ${donation.status === "Paid" ? "text-success" : "text-info"}`}><Check className="h-4 w-4" /><span className="text-sm font-semibold">{donation.status} donation</span></div><p className="mt-3 text-3xl font-semibold tabular-nums">{formatNaira(donation.amount)}</p><p className="mt-1 text-xs text-muted-foreground">{donation.targetName} · {donation.date}</p></div><div className="mt-5 space-y-4">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0"><span className="text-xs text-muted-foreground">{label}</span><span className="max-w-[58%] text-right text-xs font-semibold">{value}</span></div>)}</div><Button onClick={onClose} className="mt-3 w-full rounded-lg">Done</Button></ModalShell>;
}
