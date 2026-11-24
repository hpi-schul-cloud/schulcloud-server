import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsInt, IsNumber, IsPositive, Max, Min } from 'class-validator';

export const BOARD_IMPORT_CONFIG_TOKEN = 'BOARD_IMPORT_CONFIG_TOKEN';

// A timer with a delay above 2^31 - 1 milliseconds fires at once.
const MAX_TIMER_DELAY_IN_MINUTES = 35791;
// The delay runs in the same delivery as the import, so it counts against the acknowledgement timeout of RabbitMQ.
const MAX_RETRY_DELAY_IN_SECONDS = 60;

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

	// Must stay below the acknowledgement timeout of RabbitMQ, see ADR 0008.
	@ConfigProperty('BOARD_IMPORT_JOB_MAX_DURATION_IN_MINUTES')
	@StringToNumber()
	@IsNumber()
	@IsPositive()
	@Max(MAX_TIMER_DELAY_IN_MINUTES)
	public jobMaxDurationInMinutes = 25;

	@ConfigProperty('BOARD_IMPORT_JOB_RETRY_DELAY_IN_SECONDS')
	@StringToNumber()
	@IsNumber()
	@Min(0)
	@Max(MAX_RETRY_DELAY_IN_SECONDS)
	public jobRetryDelayInSeconds = 10;
}
