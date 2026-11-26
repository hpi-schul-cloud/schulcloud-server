import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsInt,
	IsNumber,
	IsPositive,
	IsUrl,
	Matches,
	Max,
	Min,
} from 'class-validator';

export const BOARD_IMPORT_CONFIG_TOKEN = 'BOARD_IMPORT_CONFIG_TOKEN';
export const BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN = 'BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN';
export const BOARD_IMPORT_SERVER_API_CONFIG_TOKEN = 'BOARD_IMPORT_SERVER_API_CONFIG_TOKEN';
export const BOARD_IMPORT_SOURCE_CONFIG_TOKEN = 'BOARD_IMPORT_SOURCE_CONFIG_TOKEN';

@Configuration()
export class BoardImportPublicApiConfig {
	@ConfigProperty('FEATURE_BOARD_IMPORT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureBoardImportEnabled = false;
}

@Configuration()
export class BoardImportServerApiConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}

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
	// The RabbitMQ message expires with the job, and RabbitMQ rejects an expiration above 2^32-1 ms (about 49.7 days).
	@Max(49)
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

// A host name in lowercase, or "*." plus a domain for all its subdomains. The last label starts with a letter,
// so an IPv4 address does not match.
const HOST_ENTRY_PATTERN = /^(\*\.)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]([a-z0-9-]*[a-z0-9])?$/;

@Configuration()
export class BoardImportSourceConfig {
	@ConfigProperty('BOARD_IMPORT_TASKCARDS_BOARD_HOSTS')
	@CommaSeparatedStringToArray()
	@IsArray()
	@ArrayNotEmpty()
	@Matches(HOST_ENTRY_PATTERN, { each: true })
	public taskcardsBoardHosts: string[] = ['taskcards.de', '*.taskcards.de', 'taskcards.app', '*.taskcards.app'];
}
