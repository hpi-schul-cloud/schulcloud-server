import { Configuration } from '@hpi-schul-cloud/commons';

import { ICoreModuleConfig } from '@src/core';

export interface IServerConfig extends ICoreModuleConfig {}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export default () => config;
