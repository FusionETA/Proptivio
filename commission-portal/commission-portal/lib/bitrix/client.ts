import { BITRIX_CONFIG } from './config';

export class BitrixClient {
    private webhookUrl: string;

    constructor(webhookUrl: string = BITRIX_CONFIG.WEBHOOK_URL) {
        this.webhookUrl = webhookUrl;
    }

    async call(method: string, params: Record<string, any> = {}) {
        const url = `${this.webhookUrl}/${method}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        return data.result;
    }

    // List items from SPA
    async listItems(params: {
        entityTypeId: number;
        filter?: Record<string, any>;
        select?: string[];
        order?: Record<string, string>;
        start?: number;
    }) {
        return this.call('crm.item.list', params);
    }

    // Get single item
    async getItem(entityTypeId: number, id: number) {
        return this.call('crm.item.get', {
            entityTypeId,
            id,
        });
    }

    // Update item
    async updateItem(entityTypeId: number, id: number, fields: Record<string, any>) {
        return this.call('crm.item.update', {
            entityTypeId,
            id,
            fields,
        });
    }

    // Get SPA types (for validation)
    async getTypes() {
        return this.call('crm.type.list', {
            filter: {
                isDynamic: 'Y',
            },
            select: ['id', 'title', 'entityTypeId', 'isCategoriesEnabled'],
        });
    }
}

export const bitrixClient = new BitrixClient();
