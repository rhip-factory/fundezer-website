const primaryLinks = [
  { to: "/campaigns", label: "Find a Patient" },
  { to: "/causes", label: "Support a Cause" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/hospitals", label: "Partner hospitals" },
] as const;

const moreLinks = [
  { to: "/donor", label: "Donor Hub" },
  { to: "/portal", label: "Patient Portal" },
  { to: "/success-stories", label: "Success stories" },
  { to: "/partner-donor", label: "Partner donors" },
  { to: "/about", label: "About FundEzer" },
] as const;

const signedInPortalLinks = [
  { to: "/donor", label: "Donor Hub" },
  { to: "/portal", label: "Patient Portal" },
  { to: "/admin", label: "Admin Hub" },
] as const;

export function getSiteNavigation(signedIn: boolean) {
  return {
    primary: signedIn ? primaryLinks.slice(0, 2) : [...primaryLinks],
    more: signedIn ? [...signedInPortalLinks, ...primaryLinks.slice(2), ...moreLinks] : [...moreLinks],
  };
}
