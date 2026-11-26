import { ConfigProperty, Configuration } from '@infra/configuration';
import { BOARD_IMPORT_HOST_ENTRY_PATTERN } from '@modules/board-import';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { ArrayNotEmpty, IsArray, Matches } from 'class-validator';

export const BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN = 'BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN';

@Configuration()
export class BoardImportTaskcardsConfig {
	@ConfigProperty('BOARD_IMPORT_TASKCARDS_BOARD_HOSTS')
	@CommaSeparatedStringToArray()
	@IsArray()
	@ArrayNotEmpty()
	@Matches(BOARD_IMPORT_HOST_ENTRY_PATTERN, { each: true })
	public boardHosts: string[] = ['taskcards.de', '*.taskcards.de', 'taskcards.app', '*.taskcards.app'];
}
