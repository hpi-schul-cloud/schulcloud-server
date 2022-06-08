import { Configuration } from '@hpi-schul-cloud/commons';
import { ICoreModuleConfig } from '@src/core';
import { IUserConfig, IFileStorageClientConfig } from '@src/modules/';
import { AvailableLogLevel } from './core/logger';

export interface IServerConfig extends ICoreModuleConfig, IUserConfig, IFileStorageClientConfig {}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_AVAILABLE_LOG_LEVELS') as string).split(',') as AvailableLogLevel[],
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
	FILE_STOAGE_REQUEST_TIMEOUT_MS: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
	FILE_STOAGE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
};

export default () => config;
