import { LoggerConfig } from '@core/logger';
import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { CalendarConfig } from '@infra/calendar';
import { ClassConfig } from '@modules/class';
import { FilesConfig } from '@modules/files';
import { NewsConfig } from '@modules/news';
import { PseudonymConfig } from '@modules/pseudonym';
import { RocketChatUserConfig } from '@modules/rocketchat-user';
import { TeamConfig } from '@modules/team';

export interface DeletionConfig
	extends LoggerConfig,
		CalendarConfig,
		ClassConfig,
		NewsConfig,
		TeamConfig,
		PseudonymConfig,
		FilesConfig,
		RocketChatUserConfig,
		XApiKeyAuthGuardConfig {
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__DELETION_MAX_CONCURRENT_DELETION_REQUESTS: number;
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: number;
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: number;
}
