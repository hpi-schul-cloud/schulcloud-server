import { LoggerConfig } from '@core/logger';
import { EncryptionConfig } from '@infra/encryption/encryption.config';

export interface BiloClientConfig extends EncryptionConfig, LoggerConfig {}
