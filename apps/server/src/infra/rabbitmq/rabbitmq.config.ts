import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const FilesPreviewExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;
export const FilesStorageExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;
export const MailSendExchange = Configuration.get('MAIL_SEND_EXCHANGE') as string;
export const AntivirusExchange = Configuration.get('ANTIVIRUS_EXCHANGE') as string;
export const RabbitMqURI = Configuration.get('RABBITMQ_URI') as string;
