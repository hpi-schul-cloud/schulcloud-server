import { Configuration } from '@hpi-schul-cloud/commons';

export interface IH5PLibraryManagementConfig {
	H5P_EDITOR__LIBRARY_LIST_PATH: string;
}

export const config: IH5PLibraryManagementConfig = {
	H5P_EDITOR__LIBRARY_LIST_PATH: Configuration.get('H5P_EDITOR__LIBRARY_LIST_PATH') as string,
};

export const h5PLibraryManagementConfig = () => config;
