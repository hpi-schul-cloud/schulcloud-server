import { Configuration } from '@hpi-schul-cloud/commons';
import { LanguageType } from '@shared/domain/interface';
import { getLibraryWhiteList } from './helper';

export interface H5PEditorCoreConfig {
	INCOMING_REQUEST_TIMEOUT: number;
}

export interface H5PEditorConfig extends H5PEditorCoreConfig {
	H5P_EDITOR__LIBRARY_WHITE_LIST: string[];
}

const h5pEditorCoreConfig: H5PEditorCoreConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('H5P_EDITOR__INCOMING_REQUEST_TIMEOUT') as number,
};

// Lazy-load the full config to avoid eager evaluation of JWT values
const getH5pEditorConfig = (): H5PEditorConfig => {
	const filePath = Configuration.get('H5P_EDITOR__LIBRARY_LIST_PATH') as string;
	const libraryWhiteList = getLibraryWhiteList(filePath);

	return {
		...h5pEditorCoreConfig,
		H5P_EDITOR__LIBRARY_WHITE_LIST: libraryWhiteList,
	};
};

export const translatorConfig = {
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
};

export const config = (): H5PEditorConfig => getH5pEditorConfig();
export const coreConfig = (): H5PEditorCoreConfig => h5pEditorCoreConfig;
