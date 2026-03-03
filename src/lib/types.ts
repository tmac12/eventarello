import { z } from 'zod';

export const eventStatusSchema = z.enum(['draft', 'published']);

export type EventStatus = z.infer<typeof eventStatusSchema>;

export const geminiExtractionSchema = z.object({
  title: z.string().min(1),
  event_date: z.string().describe('ISO 8601 datetime'),
  location: z.string().min(1),
  description: z.string().optional(),
});

export type GeminiExtraction = z.infer<typeof geminiExtractionSchema>;

export const createEventSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  event_date: z.string().min(1, 'La data è obbligatoria'),
  location: z.string().min(1, 'Il luogo è obbligatorio'),
  description: z.string().optional(),
  image_url: z.string().url(),
  image_path: z.string().min(1),
  status: eventStatusSchema,
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description: string | null;
  image_url: string;
  image_path: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}
