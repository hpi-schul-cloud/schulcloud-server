import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export const BOARD_IMPORT_CONFIG_TOKEN = 'BOARD_IMPORT_CONFIG_TOKEN';

@Configuration()
export class BoardImportConfig {
	@ConfigProperty('BOARD_IMPORT_JOB_RETENTION_IN_DAYS')
	@StringToNumber()
	@IsInt()
	@Min(1)
	public jobRetentionInDays = 30;

	@ConfigProperty('BOARD_IMPORT_JOB_MAX_ATTEMPTS')
	@StringToNumber()
	@IsInt()
	@Min(1)
	public jobMaxAttempts = 3;

	// Must stay below the acknowledgement timeout of RabbitMQ (30 minutes by default).
	// The broker closes the channel of a consumer that holds a message longer.
	@ConfigProperty('BOARD_IMPORT_JOB_MAX_DURATION_IN_MINUTES')
	@StringToNumber()
	@IsNumber()
	@Min(0)
	public jobMaxDurationInMinutes = 25;

	@ConfigProperty('BOARD_IMPORT_JOB_RETRY_DELAY_IN_SECONDS')
	@StringToNumber()
	@IsNumber()
	@Min(0)
	public jobRetryDelayInSeconds = 10;
}
