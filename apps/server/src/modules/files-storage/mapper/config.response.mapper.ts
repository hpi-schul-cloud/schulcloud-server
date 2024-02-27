import { FilesStorageConfigResponse } from '../dto/files-storage-config.response';

export class ConfigResponseMapper {
	public static mapToResponse(maxFileSize: number): FilesStorageConfigResponse {
		const mappedConfig = {
			MAX_FILE_SIZE: maxFileSize,
		};
		const configResponse = new FilesStorageConfigResponse(mappedConfig);

		return configResponse;
	}
}
