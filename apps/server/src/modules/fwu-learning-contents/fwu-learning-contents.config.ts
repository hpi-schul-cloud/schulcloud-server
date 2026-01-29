import { Configuration } from '@hpi-schul-cloud/commons';

export interface FwuLearningContentsConfig {
	INCOMING_REQUEST_TIMEOUT: number;
	FEATURE_FWU_CONTENT_ENABLED: boolean;
}

const fwuLearningContentsConfig: FwuLearningContentsConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FWU_CONTENT__INCOMING_REQUEST_TIMEOUT_MS') as number,
	FEATURE_FWU_CONTENT_ENABLED: Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean,
};

export const config = () => fwuLearningContentsConfig;
