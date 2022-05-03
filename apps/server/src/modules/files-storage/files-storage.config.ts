import { Configuration } from '@hpi-schul-cloud/commons';
import { ICoreModuleConfig } from '@src/core';
import { AvailableLogLevel } from '@src/core/logger';

export interface IFileStorageConfig extends ICoreModuleConfig {}

const config: IFileStorageConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_AVAILABLE_LOG_LEVELS') as string).split(',') as AvailableLogLevel[],
};

export default () => config;
