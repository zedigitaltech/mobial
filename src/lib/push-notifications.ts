import { db } from "./db";
import { logger } from "./logger";

const log = logger.child("push-notifications");

interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, string>;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const tokens = await db.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    log.info("Push notifications sent", {
      metadata: { userId, count: messages.length, result },
    });
  } catch (error) {
    log.errorWithException("Failed to send push notification", error);
  }
}
