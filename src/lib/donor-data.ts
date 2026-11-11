export const formatNaira = (value: number) =>
  `₦${Math.round(value).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

// Wallet has no backend representation yet, so wallet activity remains sample data.
export const walletTransactions = [
  { id: "WAL-0812-334", date: "12 Aug 2026", label: "Wallet funding", reference: "Card •••• 2048", amount: 25000, kind: "credit", balance: 75000, status: "Completed" },
  { id: "WAL-0808-120", date: "08 Aug 2026", label: "Gift from wallet", reference: "Campaign donation", amount: 10000, kind: "debit", balance: 50000, status: "Completed" },
  { id: "WAL-0804-889", date: "04 Aug 2026", label: "Gift from wallet", reference: "Campaign donation", amount: 20000, kind: "debit", balance: 60000, status: "Completed" },
  { id: "WAL-0801-441", date: "01 Aug 2026", label: "Wallet funding", reference: "Bank transfer", amount: 50000, kind: "credit", balance: 80000, status: "Completed" },
];
