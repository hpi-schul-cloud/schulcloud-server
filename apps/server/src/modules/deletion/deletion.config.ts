import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const DELETION_CONFIG_TOKEN = 'DELETION_CONFIG_TOKEN';

@Configuration()
export class DeletionConfig {
	@ConfigProperty('ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS')
	@StringToNumber()
	@IsNumber()
	public adminApiDeletionModificationThresholdMs = 300000;

	@ConfigProperty('ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER')
	@StringToNumber()
	@IsNumber()
	public adminApiDeletionExecutionBatchNumber = 20;

	@ConfigProperty('ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS')
	@StringToNumber()
	@IsNumber()
	public adminApiDeletionConsiderFailedAfterMs = 360000000;

	@ConfigProperty('ADMIN_API__DELETION_DELETE_AFTER_MINUTES')
	@StringToNumber()
	@IsNumber()
	public adminApiDeletionDeleteAfterMinutes = 43200;
}
