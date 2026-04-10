import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray, StringToNumber } from '@shared/controller/transformer';
import { LanguageType } from '@shared/domain/interface';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export const H5P_EDITOR_CONFIG_TOKEN = 'H5P_EDITOR_CONFIG_TOKEN';

@Configuration()
export class H5PEditorConfig {
	@ConfigProperty('H5P_EDITOR__BODYPARSER_JSON_LIMIT_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	public bodyParserJsonLimitInBytes = 4194304; // 4MB

	@ConfigProperty('H5P_EDITOR__MAX_FILE_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	public maxFileSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('H5P_EDITOR__MAX_TOTAL_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	public maxTotalSize = 1024 * 1024 * 1024; // 1 GB

	@ConfigProperty('H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME')
	@StringToNumber()
	@IsNumber()
	public installLibraryLockMaxOccupationTime = 600000;

	@ConfigProperty('H5P_EDITOR__LIBRARY_LIST')
	@CommaSeparatedStringToArray()
	@IsString({ each: true })
	public libraryList = [
		'H5P.Accordion',
		'H5P.AdventCalendar',
		'H5P.Agamotto',
		'H5P.ArithmeticQuiz',
		'H5P.ARScavenger',
		'H5P.Blanks',
		'H5P.BranchingScenario',
		'H5P.Chart',
		'H5P.Collage',
		'H5P.Column',
		'H5P.Cornell',
		'H5P.CoursePresentation',
		'H5P.Crossword',
		'H5P.Dialogcards',
		'H5P.DocumentationTool',
		'H5P.DragQuestion',
		'H5P.DragText',
		'H5P.Essay',
		'H5P.FindTheWords',
		'H5P.Flashcards',
		'H5P.GameMap',
		'H5P.GuessTheAnswer',
		'H5P.ImageHotspotQuestion',
		'H5P.ImageHotspots',
		'H5P.ImageJuxtaposition',
		'H5P.ImageMultipleHotspotQuestion',
		'H5P.ImagePair',
		'H5P.ImageSequencing',
		'H5P.ImageSlider',
		'H5P.InfoWall',
		'H5P.InteractiveBook',
		'H5P.InteractiveVideo',
		'H5P.KewArCode',
		'H5P.MarkTheWords',
		'H5P.MultiChoice',
		'H5P.MultiMediaChoice',
		'H5P.PersonalityQuiz',
		'H5P.QuestionSet',
		'H5P.SingleChoiceSet',
		'H5P.SortParagraphs',
		'H5P.StructureStrip',
		'H5P.Summary',
		'H5P.Timeline',
		'H5P.TrueFalse',
	];

	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	public availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];
}
