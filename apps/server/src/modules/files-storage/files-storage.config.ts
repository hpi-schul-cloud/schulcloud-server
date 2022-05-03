import { Configuration } from '@hpi-schul-cloud/commons';
import { ICoreModuleConfig } from '@src/core';
import { AvailableLogLevel } from '@src/core/logger';

export interface IFileStorageConfig extends ICoreModuleConfig {}

const config: IFileStorageConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
	NEST_LOG_LEVEL: (Configuration.get('NEST_LOG_LEVEL') as string).split(',') as AvailableLogLevel[],
};

export default () => config;
