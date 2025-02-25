import { Configuration } from '@hpi-schul-cloud/commons/lib';

// should be move to config interface and added reading on places that use the module
export const FilesPreviewExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;
export const FilesStorageExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;
export const MailSendExchange = Configuration.get('MAIL_SEND_EXCHANGE') as string;
export const AntivirusExchange = Configuration.get('ANTIVIRUS_EXCHANGE') as string;
export const SchulconnexProvisioningExchange = Configuration.get('PROVISIONING_SCHULCONNEX_EXCHANGE') as string;
export const RabbitMqURI = Configuration.get('RABBITMQ_URI') as string;
export const HeartBeatIntervalInSeconds = Configuration.get('RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS') as number;

export interface RabbitMqConfig {
	RABBITMQ_URI: string;
}
