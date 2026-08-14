import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { writeStory } from "./story.server";

const schema = z.object({
  answers: z.array(z.string().max(1200)).length(7),
  tone: z.enum(["Warm and hopeful", "Calm and factual", "Urgent but dignified"]),
  hospital: z.string().max(120).default(""),
  patientName: z.string().max(120).default(""),
});

export const generateStory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => writeStory(data));
