export type Ticket = { id: string; text: string };

export const TICKETS: readonly Ticket[] = [
  { id: "T-101", text: "I was charged twice for the Pro plan this month. Can you refund the extra charge?" },
  { id: "T-102", text: "The export button on the reports page spins forever and never downloads the CSV." },
  { id: "T-103", text: "How do I invite a teammate and give them read-only access to our workspace?" },
  { id: "T-104", text: "I can't log in anymore. The reset password email never arrives." },
  { id: "T-105", text: "Please switch our invoices to annual billing and add our VAT number." },
  { id: "T-106", text: "After the last update the dashboard shows yesterday's numbers as zero." },
];
