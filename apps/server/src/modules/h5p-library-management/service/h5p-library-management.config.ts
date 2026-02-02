import { Configuration } from '@hpi-schul-cloud/commons';

export interface IH5PLibraryManagementConfig {
	H5P_EDITOR__LIBRARY_LIST_PATH: string;
	H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME: number;
}

export const config: IH5PLibraryManagementConfig = {
	H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME: Configuration.get(
		'H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME'
	) as number,
	H5P_EDITOR__LIBRARY_LIST_PATH: Configuration.get('H5P_EDITOR__LIBRARY_LIST_PATH') as string,
};

export const h5PLibraryManagementConfig = () => config;
