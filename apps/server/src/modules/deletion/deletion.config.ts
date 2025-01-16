import { LoggerConfig } from '@core/logger';
import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { CalendarConfig } from '@infra/calendar';
import { ClassConfig } from '@modules/class';
import { FilesConfig } from '@modules/files';
import { NewsConfig } from '@modules/news';
import { PseudonymConfig } from '@modules/pseudonym';
import { RocketChatUserConfig } from '@modules/rocketchat-user';
import { TeamsConfig } from '@modules/teams';

export interface DeletionConfig
	extends LoggerConfig,
		CalendarConfig,
		ClassConfig,
		NewsConfig,
		TeamsConfig,
		PseudonymConfig,
		FilesConfig,
		RocketChatUserConfig,
		XApiKeyAuthGuardConfig {
	ADMIN_API__MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS: number;
	ADMIN_API__DELETION_DELAY_MILLISECONDS: number;
}
