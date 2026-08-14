type StoryInput = {
  answers: string[];
  tone: string;
  hospital: string;
  patientName: string;
};

const QUESTIONS = [
  "What illness do you have?",
  "When were you diagnosed?",
  "Who diagnosed you?",
  "Have you received treatment before?",
  "How does the illness affect your life?",
  "Why do you need financial support?",
  "What happens if treatment is delayed?",
];

export function fallbackStory({ answers, hospital }: StoryInput) {
  const [illness = "", when = "", who = "", before = "", effect = "", why = "", delay = ""] =
    answers;
  return [
    `I am living with ${illness.trim()}${when.trim() ? `, diagnosed ${when.trim()}` : ""}${
      who.trim() ? ` by ${who.trim()}` : ""
    }.`,
    before.trim() ? `So far, ${before.trim().toLowerCase()}.` : "",
    effect.trim() ? `The illness has changed my life: ${effect.trim().toLowerCase()}.` : "",
    why.trim() ? `I am asking for support because ${why.trim().toLowerCase()}.` : "",
    delay.trim() ? `If treatment is delayed, ${delay.trim().toLowerCase()}.` : "",
    `${hospital || "My hospital"} has reviewed my records, and every naira donated is paid directly to them for my treatment.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function writeStory(input: StoryInput): Promise<{ story: string; ai: boolean }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { story: fallbackStory(input), ai: false };

  const facts = QUESTIONS.map((q, i) => `${q}\n${(input.answers[i] || "").trim() || "(not given)"}`)
    .join("\n\n");

  const system = `You are a compassionate medical-fundraising writer for FundEzer, a Nigerian platform where donations are paid directly to partner hospitals.
Write the patient's campaign story in FIRST PERSON, 150-200 words, 3 short paragraphs separated by blank lines.
Rules:
- Use only the facts provided; never invent diagnoses, dates, costs or outcomes.
- Plain, dignified language a Nigerian reader would use. No melodrama, no pity-begging, no emojis, no headings.
- Open with who I am and what I am facing, then the impact on my daily life, then a clear, hopeful ask.
- End by noting that ${input.hospital || "my hospital"} has verified my records and funds go straight to the hospital.
- Tone: ${input.tone}.
Return only the story text.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Patient name: ${input.patientName || "(not given)"}\nHospital: ${
              input.hospital || "(not selected)"
            }\n\n${facts}`,
          },
        ],
      }),
    });
    if (!res.ok) return { story: fallbackStory(input), ai: false };
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { story: fallbackStory(input), ai: false };
    return { story: text, ai: true };
  } catch {
    return { story: fallbackStory(input), ai: false };
  }
}
