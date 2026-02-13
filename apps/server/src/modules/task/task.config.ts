import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const TASK_PUBLIC_API_CONFIG_TOKEN = 'TASK_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class TaskPublicApiConfig {
	@ConfigProperty('FEATURE_COPY_SERVICE_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCopyServiceEnabled = false;
}
