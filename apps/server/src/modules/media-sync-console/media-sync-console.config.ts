import { Configuration } from '@hpi-schul-cloud/commons';
import { LoggerConfig } from '@core/logger';
import { BiloClientConfig } from '@infra/bilo-client';
import { ConsoleWriterConfig } from '@infra/console';
import { RabbitMqConfig } from '@infra/rabbitmq';
import { MediaSourceConfig } from '@modules/media-source';
import { ToolConfig } from '@modules/tool';

export interface MediaSyncConsoleConfig
	extends ConsoleWriterConfig,
		RabbitMqConfig,
		BiloClientConfig,
		LoggerConfig,
		MediaSourceConfig,
		ToolConfig {}

const config: MediaSyncConsoleConfig = {
	AES_KEY: Configuration.get('AES_KEY') as string,
	CTL_TOOLS_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	CTL_TOOLS_RELOAD_TIME_MS: Configuration.get('CTL_TOOLS_RELOAD_TIME_MS') as number,
	CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: Configuration.get(
		'CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES'
	) as number,
	CTL_TOOLS__PREFERRED_TOOLS_LIMIT: Configuration.get('CTL_TOOLS__PREFERRED_TOOLS_LIMIT') as number,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	FEATURE_CTL_TOOLS_COPY_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	FEATURE_PREFERRED_CTL_TOOLS_ENABLED: Configuration.get('FEATURE_PREFERRED_CTL_TOOLS_ENABLED') as boolean,
	FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') as boolean,
	FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: Configuration.get('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED') as boolean,
	FILES_STORAGE__SERVICE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	PUBLIC_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
};

export const mediaSyncConsoleConfig = (): MediaSyncConsoleConfig => config;
