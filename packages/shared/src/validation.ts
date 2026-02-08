import { z } from 'zod';

export const preferredTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?:-(?:[01]\d|2[0-3]):[0-5]\d)?$/, 'Use HH:mm or HH:mm-HH:mm');

export const createUserSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format like +14155552671'),
  level: z.string().min(1).max(50),
  vocabEstimate: z.coerce.number().int().min(0).max(100000),
  goals: z.string().min(5).max(500),
  timezone: z.string().min(2),
  callsPerDay: z.coerce.number().int().min(1).max(3),
  preferredTimes: z.array(preferredTimeSchema).min(1).max(8)
});

export const updateUserSchema = createUserSchema.pick({ goals: true, callsPerDay: true, preferredTimes: true }).extend({
  timezone: z.string().min(2)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
