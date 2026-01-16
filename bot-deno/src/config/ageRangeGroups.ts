/**
 * Age range group configuration
 */

export type AgeRange = "0-2" | "3-5" | "6-8" | "9-12" | "13+";

export function getAgeRangeGroups(): Map<number, AgeRange> {
  const groups = new Map<number, AgeRange>();
  
  const GROUP_0_2 = Deno.env.get("GROUP_0_2");
  const GROUP_3_5 = Deno.env.get("GROUP_3_5");
  const GROUP_6_8 = Deno.env.get("GROUP_6_8");
  const GROUP_9_12 = Deno.env.get("GROUP_9_12");
  const GROUP_13_PLUS = Deno.env.get("GROUP_13_PLUS");
  
  if (GROUP_0_2) groups.set(parseInt(GROUP_0_2), "0-2");
  if (GROUP_3_5) groups.set(parseInt(GROUP_3_5), "3-5");
  if (GROUP_6_8) groups.set(parseInt(GROUP_6_8), "6-8");
  if (GROUP_9_12) groups.set(parseInt(GROUP_9_12), "9-12");
  if (GROUP_13_PLUS) groups.set(parseInt(GROUP_13_PLUS), "13+");
  
  return groups;
}

export function getAgeRange(chatId: number): AgeRange {
  const groups = getAgeRangeGroups();
  return groups.get(chatId) ?? "0-2";
}
