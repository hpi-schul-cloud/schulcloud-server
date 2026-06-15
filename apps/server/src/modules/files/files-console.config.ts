import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

export const FILES_CONSOLE_CONFIG_TOKEN = 'FILES_CONSOLE_CONFIG_TOKEN';

@Configuration()
export class FilesConsoleConfig {
	@ConfigProperty('DELETE_S3_FILES_CRONJOB_USERNAME')
	@IsString()
	public cronjobUsername!: string;

	@ConfigProperty('DELETE_S3_FILES_CRONJOB_TOKEN')
	@IsString()
	public cronjobToken!: string;
}
