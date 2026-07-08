import { type EncryptionConfig } from '@infra/encryption';
import { type TspClientConfig } from '../tsp-client.config';

export interface TspClientModuleOptions {
	encryptionConfig: { configInjectionToken: string; configConstructor: new () => EncryptionConfig };
	tspClientConfig: { configInjectionToken: string; configConstructor: new () => TspClientConfig };
}
