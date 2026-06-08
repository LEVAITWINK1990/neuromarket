import { env } from "@/lib/env";
import { scoped } from "@/lib/logger";

const log = scoped("email");

// §6.6 — transactional email. Three back-ends:
//   - "console": dev / test, just logs to stdout
//   - "resend":  https://resend.com (REST API, simplest production setup)
//   - "smtp":    fallback, requires nodemailer (not installed by default; we
//                emit a clear runtime error so misconfiguration is loud)
//
// All call sites go through {@link sendEmail}. Templates live in
// {@link emailTemplates} and produce { subject, text, html } triples.

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    log.info(
      { to: payload.to, subject: payload.subject, body: payload.text },
      "console provider — email not actually sent",
    );
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(payload: EmailPayload): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend send failed: ${res.status} ${detail}`);
    }
  }
}

class SmtpEmailProvider implements EmailProvider {
  async send(_payload: EmailPayload): Promise<void> {
    // We deliberately avoid bundling nodemailer to keep the dep tree small.
    // If you choose SMTP, add `nodemailer` and replace this stub.
    throw new Error(
      "EMAIL_PROVIDER=smtp configured but nodemailer is not installed. " +
        "Either install nodemailer and wire it here, or switch to EMAIL_PROVIDER=resend.",
    );
  }
}

let cached: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (cached) return cached;
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      cached = new ResendEmailProvider(env.EMAIL_RESEND_API_KEY!, env.EMAIL_FROM!);
      break;
    case "smtp":
      cached = new SmtpEmailProvider();
      break;
    case "console":
    default:
      cached = new ConsoleEmailProvider();
      break;
  }
  return cached;
}

/** Test-only helper to swap the provider. */
export function setEmailProviderForTest(p: EmailProvider | null) {
  cached = p;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await getProvider().send(payload);
}

// ===== Templates =====

const APP_NAME = "NeuroMarket";

function header(title: string) {
  return `${APP_NAME} — ${title}\n${"=".repeat(20)}\n\n`;
}

export const emailTemplates = {
  verifyEmail({ verifyUrl }: { verifyUrl: string }): EmailPayload {
    return {
      to: "",
      subject: `${APP_NAME}: подтвердите ваш email`,
      text:
        header("Подтверждение email") +
        `Подтвердите вашу почту, перейдя по ссылке (действует 24 часа):\n\n${verifyUrl}\n\n` +
        `Если вы не регистрировались, проигнорируйте это письмо.`,
    };
  },
  resetPassword({ resetUrl }: { resetUrl: string }): EmailPayload {
    return {
      to: "",
      subject: `${APP_NAME}: сброс пароля`,
      text:
        header("Сброс пароля") +
        `Чтобы сбросить пароль, перейдите по ссылке (действует 1 час):\n\n${resetUrl}\n\n` +
        `Если вы не запрашивали сброс, проигнорируйте это письмо.`,
    };
  },
  orderPaid({
    orderId,
    amountCents,
    currency,
  }: {
    orderId: string;
    amountCents: number;
    currency: string;
  }): EmailPayload {
    return {
      to: "",
      subject: `${APP_NAME}: оплата заказа ${orderId} прошла`,
      text:
        header("Оплата прошла") +
        `Заказ: ${orderId}\nСумма: ${(amountCents / 100).toFixed(2)} ${currency}\n\n` +
        `Откройте кабинет, чтобы получить ключи / скачать файлы.`,
    };
  },
  orderDelivered({ orderId }: { orderId: string }): EmailPayload {
    return {
      to: "",
      subject: `${APP_NAME}: товар по заказу ${orderId} доставлен`,
      text:
        header("Доставка") +
        `Продавец отметил доставку по заказу ${orderId}. ` +
        `Откройте кабинет, чтобы подтвердить получение и разморозить средства продавцу.`,
    };
  },
  refundIssued({
    orderId,
    amountCents,
    currency,
  }: {
    orderId: string;
    amountCents: number;
    currency: string;
  }): EmailPayload {
    return {
      to: "",
      subject: `${APP_NAME}: возврат по заказу ${orderId}`,
      text:
        header("Возврат") +
        `По заказу ${orderId} оформлен возврат на сумму ` +
        `${(amountCents / 100).toFixed(2)} ${currency}. Средства вернутся на исходный способ оплаты.`,
    };
  },
};
