import { LoggerConfig } from '@core/logger';
import { CalendarConfig } from '@infra/calendar';
import { ClassConfig } from '@modules/class';
import { FilesConfig } from '@modules/files';
import { PseudonymConfig } from '@modules/pseudonym';
import { TeamConfig } from '@modules/team';
import { UserConfig } from '@modules/user';

export interface DeletionConfig
	extends LoggerConfig,
		CalendarConfig,
		ClassConfig,
		TeamConfig,
		PseudonymConfig,
		FilesConfig,
		UserConfig {
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER: number;
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: number;
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: number;
}
