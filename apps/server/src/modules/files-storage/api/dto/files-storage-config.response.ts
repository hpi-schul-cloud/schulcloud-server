import { ApiProperty } from '@nestjs/swagger';

export class FilesStorageConfigResponse {
	@ApiProperty()
	public MAX_FILE_SIZE: number;

	constructor(config: FilesStorageConfigResponse) {
		this.MAX_FILE_SIZE = config.MAX_FILE_SIZE;
	}
}
