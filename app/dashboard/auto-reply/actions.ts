"use server";

import { db } from "@/db";
import { autoReplyRules, users } from "@/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getRules() {
  const userId = await getUserId();
  return await db.query.autoReplyRules.findMany({
    where: eq(autoReplyRules.userId, userId),
    orderBy: [asc(autoReplyRules.priority)],
  });
}

export async function saveRule(data: any, id?: string) {
  const userId = await getUserId();
  
  if (id) {
    await db.update(autoReplyRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(autoReplyRules.id, id), eq(autoReplyRules.userId, userId)));
  } else {
    // Get max priority
    const rules = await getRules();
    const maxPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) : -1;
    
    await db.insert(autoReplyRules).values({
      ...data,
      userId,
      priority: maxPriority + 1,
    });
  }
  
  revalidatePath("/dashboard/auto-reply");
}

export async function deleteRule(id: string) {
  const userId = await getUserId();
  await db.delete(autoReplyRules)
    .where(and(eq(autoReplyRules.id, id), eq(autoReplyRules.userId, userId)));
    
  revalidatePath("/dashboard/auto-reply");
}

export async function toggleRule(id: string, isActive: boolean) {
  const userId = await getUserId();
  await db.update(autoReplyRules)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(autoReplyRules.id, id), eq(autoReplyRules.userId, userId)));
    
  revalidatePath("/dashboard/auto-reply");
}

export async function reorderRule(id: string, direction: "up" | "down") {
  const userId = await getUserId();
  const rules = await getRules();
  const currentIndex = rules.findIndex(r => r.id === id);
  
  if (currentIndex === -1) return;
  
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= rules.length) return;
  
  const currentRule = rules[currentIndex];
  const targetRule = rules[targetIndex];
  
  // Swap priorities
  await db.update(autoReplyRules)
    .set({ priority: targetRule.priority })
    .where(and(eq(autoReplyRules.id, currentRule.id), eq(autoReplyRules.userId, userId)));
    
  await db.update(autoReplyRules)
    .set({ priority: currentRule.priority })
    .where(and(eq(autoReplyRules.id, targetRule.id), eq(autoReplyRules.userId, userId)));
    
  revalidatePath("/dashboard/auto-reply");
}
