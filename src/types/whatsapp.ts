export type ContactInMessage = {
    name: {
        first_name?: string,
        last_name?: string,
        formatted_name: string
    },
    phones: {
        phone?: string,
        wa_id?: string,
        type?: string
    }[],
    vcard?: string | null,
    origin: string
}

export type MetaMediaObject = {
    id: string,
    mime_type: string,
    sha256?: string,
    caption?: string,
    filename?: string,
    voice?: boolean,
}

export type MetaLocation = {
    latitude: number,
    longitude: number,
    address?: string,
    name?: string,
}

export type MetaMessage = {
    id: string,
    timestamp: string,
    from?: string,
    from_user_id?: string,
    type: string,
    text?: {
        body: string
    }
    location?: MetaLocation,
    image?: MetaMediaObject,
    video?: MetaMediaObject,
    audio?: MetaMediaObject,
    document?: MetaMediaObject,
    contacts?: ContactInMessage[],
    interactive?: {
        type: "button_reply" | "list_reply";
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
        nfm_reply?: {
            name: string;
            body: string;
            response_json: string;
        };
    };
}

export type MetaContact =  {
    profile?: {
        name?: string,
        username?: string,
    }
    wa_id?: string,
    user_id?: string,
}

export type DeliveryStatus = {
    id: string,
    status: string,
    timestamp: string,
    recipient_id: string,
    conversation?: {
        id?: string,
        expiration_timestamp?: string,
        origin?: {
            type?: string
        }
    }
}

export type MetaWebhookValue = {
    messaging_product: string,
    metadata: {
        display_phone_number: string,
        phone_number_id: string
    },
    statuses?: DeliveryStatus[],
    contacts?: MetaContact[],
    messages?: MetaMessage[],
}

export type MetaWebhookChange = {
    field: string,
    value: MetaWebhookValue,
}

export type MetaWebhookEntry = {
    id: string,
    changes: MetaWebhookChange[]
} 

export type MetaWebhookPayload = {
    object: string,
    entry: MetaWebhookEntry[],
}