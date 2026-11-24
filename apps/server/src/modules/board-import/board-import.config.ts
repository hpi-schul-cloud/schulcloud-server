import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsInt, Max, Min } from 'class-validator';

export const BOARD_IMPORT_CONFIG_TOKEN = 'BOARD_IMPORT_CONFIG_TOKEN';

@Configuration()
export class BoardImportConfig {
	@ConfigProperty('BOARD_IMPORT_JOB_RETENTION_IN_DAYS')
	@StringToNumber()
	@IsInt()
	@Min(1)
	// The RabbitMQ message expires with the job, and RabbitMQ rejects an expiration above 2^32-1 ms (about 49.7 days).
	@Max(49)
	public jobRetentionInDays = 30;
}
