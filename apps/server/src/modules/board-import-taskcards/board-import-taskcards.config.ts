import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export const BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN = 'BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN';

@Configuration()
export class BoardImportTaskcardsConfig {
	@ConfigProperty('BOARD_IMPORT_TASKCARDS_BOARD_HOSTS')
	@CommaSeparatedStringToArray()
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	public boardHosts: string[] = ['taskcards.de', '*.taskcards.de', 'taskcards.app', '*.taskcards.app'];
}
