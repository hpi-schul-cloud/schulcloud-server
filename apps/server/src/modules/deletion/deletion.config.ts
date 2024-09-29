import { LoggerConfig } from '@src/core/logger';
import { CalendarConfig } from '@src/infra/calendar';
import { ClassConfig } from '@modules/class';
import { XApiKeyConfig } from '@infra/auth-guard';
import { NewsConfig } from '@modules/news';
import { TeamsConfig } from '@modules/teams';
import { PseudonymConfig } from '@modules/pseudonym';
import { FilesConfig } from '@modules/files';
import { RocketChatUserConfig } from '@modules/rocketchat-user';

export interface DeletionConfig
	extends LoggerConfig,
		CalendarConfig,
		ClassConfig,
		NewsConfig,
		TeamsConfig,
		PseudonymConfig,
		FilesConfig,
		RocketChatUserConfig,
		XApiKeyConfig {
	ADMIN_API__MODIFICATION_THRESHOLD_MS: number;
	ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS: number;
	ADMIN_API__DELETION_DELAY_MILLISECONDS: number;
}
