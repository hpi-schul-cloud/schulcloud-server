import { Configuration } from '@hpi-schul-cloud/commons';

export enum ContentDisposition {
    Inline = 'INLINE',
    Attachment = 'ATTACHMENT'
};

export const rabbitMqUri = Configuration.get('RABBITMQ_URI');

export const exchange = Configuration.get('MAIL_SEND_EXCHANGE');

export const routingKey = 'mail-drop';