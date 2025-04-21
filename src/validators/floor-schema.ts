
import * as z from "zod";

export const floorSchema = z.object({
  name: z.string().min(1, "Floor name is required"),
  spots: z.coerce.number().min(1, "Total spots must be at least 1"),
});
