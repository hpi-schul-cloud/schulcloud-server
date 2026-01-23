import { CalendarConfig } from '@infra/calendar';
import { ClassConfig } from '@modules/class';
import { PseudonymConfig } from '@modules/pseudonym';
import { UserConfig } from '@modules/user';

export interface DeletionConfig extends CalendarConfig, ClassConfig, PseudonymConfig, UserConfig {
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER: number;
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: number;
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: number;
}
