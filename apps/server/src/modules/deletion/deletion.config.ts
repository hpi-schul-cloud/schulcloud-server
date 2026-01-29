import { ClassConfig } from '@modules/class';

export interface DeletionConfig extends ClassConfig {
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER: number;
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: number;
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: number;
}
