import { Configuration } from '@hpi-schul-cloud/commons';
import { ICoreModuleConfig } from '@src/core';
import { IUserConfig } from '@src/modules/';
import { AvailableLogLevel } from './core/logger';

export interface IServerConfig extends ICoreModuleConfig, IUserConfig {}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_LOG_LEVEL') as string).split(',') as AvailableLogLevel[],
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
};

export default () => config;
