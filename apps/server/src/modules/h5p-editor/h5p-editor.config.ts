import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/controller/transformer';
import { LanguageType } from '@shared/domain/interface';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export const H5P_EDITOR_CONFIG_TOKEN = 'H5P_EDITOR_CONFIG_TOKEN';

@Configuration()
export class H5PEditorConfig {
	@ConfigProperty('H5P_EDITOR__LIBRARY_LIST_PATH')
	@IsString()
	public libraryListPath = 'config/h5p-libraries.yaml';

	@ConfigProperty('H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME')
	@StringToNumber()
	@IsNumber()
	public installLibraryLockMaxOccupationTime = 600000;

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	public availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
