import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsInt, Min } from 'class-validator';

export const BOARD_IMPORT_CONFIG_TOKEN = 'BOARD_IMPORT_CONFIG_TOKEN';

@Configuration()
export class BoardImportConfig {
	@ConfigProperty('BOARD_IMPORT_JOB_RETENTION_IN_DAYS')
	@StringToNumber()
	@IsInt()
	@Min(1)
	public jobRetentionInDays = 30;
}
