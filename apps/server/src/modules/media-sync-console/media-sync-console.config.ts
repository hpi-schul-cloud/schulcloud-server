import { Configuration } from '@hpi-schul-cloud/commons';
import { ConsoleWriterConfig } from '@infra/console';
import { RabbitMqConfig } from '@infra/rabbitmq';
import { MediaSourceConfig } from '@modules/media-source';

export interface MediaSyncConsoleConfig extends ConsoleWriterConfig, RabbitMqConfig, MediaSourceConfig {}

const config: MediaSyncConsoleConfig = {
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
};

export const mediaSyncConsoleConfig = (): MediaSyncConsoleConfig => config;
