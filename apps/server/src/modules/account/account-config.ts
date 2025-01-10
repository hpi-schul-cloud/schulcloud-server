import { LoggerConfig } from '@src/core/logger';
import { SystemConfig } from '@modules/system';

export interface AccountConfig extends LoggerConfig, SystemConfig {
	LOGIN_BLOCK_TIME: number;
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: boolean;
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: boolean;
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: boolean;
}
