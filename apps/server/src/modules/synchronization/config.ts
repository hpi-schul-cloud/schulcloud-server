import { Configuration } from '@hpi-schul-cloud/commons';

export interface SynchronizationConfig {
	SYNCHRONIZATION_CHUNK: number;
}

const synchronizationConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
};

export const config = () => synchronizationConfig;
