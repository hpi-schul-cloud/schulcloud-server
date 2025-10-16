import { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons';

export interface IH5PLibraryManagementConfig extends CoreModuleConfig {
	H5P_EDITOR__LIBRARY_LIST_PATH: string;
	H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME: number;
	NEST_LOG_LEVEL: string;
}

export const config: IH5PLibraryManagementConfig = {
	H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME: Configuration.get(
		'H5P_EDITOR__INSTALL_LIBRARY_LOCK_MAX_OCCUPATION_TIME'
	) as number,
	H5P_EDITOR__LIBRARY_LIST_PATH: Configuration.get('H5P_EDITOR__LIBRARY_LIST_PATH') as string,
	NEST_LOG_LEVEL: Configuration.get('H5P_Library__LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
};

export const h5PLibraryManagementConfig = () => config;
