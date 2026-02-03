import { Configuration } from '@hpi-schul-cloud/commons';

export interface FwuLearningContentsConfig {
	INCOMING_REQUEST_TIMEOUT: number;
}

const fwuLearningContentsConfig: FwuLearningContentsConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FWU_CONTENT__INCOMING_REQUEST_TIMEOUT_MS') as number,
};

export const config = () => fwuLearningContentsConfig;
