import axios from "axios";
import { env } from "../utils/env.js";

const WHATSAPP_API_VERSION = "v23.0";

export type ReplyButton = {
  id: string;
  title: string;
};

export type ListRow = {
  id: string;
  title: string;
  description?: string;
};

export type ListSection = {
  title: string;
  rows: ListRow[];
};

async function postWhatsAppMessage(
  phoneNumberId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await axios.post(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${env.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  await postWhatsAppMessage(phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: text,
    },
  });
}

export async function sendReplyButtonsMessage(
  phoneNumberId: string,
  to: string,
  body: string,
  buttons: ReplyButton[],
  header?: string,
  footer?: string
): Promise<void> {
  const interactive: Record<string, unknown> = {
    type: "button",
    body: {
      text: body,
    },
    action: {
      buttons: buttons.map((button) => ({
        type: "reply",
        reply: {
          id: button.id,
          title: button.title,
        },
      })),
    },
  };

  if (header) {
    interactive.header = {
      type: "text",
      text: header,
    };
  }

  if (footer) {
    interactive.footer = {
      text: footer,
    };
  }

  await postWhatsAppMessage(phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive,
  });
}

export async function sendListMessage(
  phoneNumberId: string,
  to: string,
  body: string,
  buttonText: string,
  sections: ListSection[],
  header?: string,
  footer?: string
): Promise<void> {
  const interactive: Record<string, unknown> = {
    type: "list",
    body: {
      text: body,
    },
    action: {
      button: buttonText,
      sections,
    },
  };

  if (header) {
    interactive.header = {
      type: "text",
      text: header,
    };
  }

  if (footer) {
    interactive.footer = {
      text: footer,
    };
  }

  await postWhatsAppMessage(phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive,
  });
}

export async function sendFlowMessage(
  phoneNumberId: string,
  to: string,
  flowId: string,
  body: string,
  ctaText: string,
  flowToken: string
): Promise<void> {
  await postWhatsAppMessage(phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "flow",
      body: {
        text: body,
      },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_id: flowId,
          flow_cta: ctaText,
          flow_token: flowToken,
          flow_action: "navigate",
          mode: "draft",
          flow_action_payload: {
            screen: "COMPLAINT_DETAILS",
          },
        },
      },
    },
  });
}