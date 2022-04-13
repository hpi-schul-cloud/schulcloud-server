import { Configuration } from '@hpi-schul-cloud/commons';

import { ICoreModuleConfig } from '@src/core';

export interface IFileStorageConfig extends ICoreModuleConfig {}

const config: IFileStorageConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
};

export default () => config;
