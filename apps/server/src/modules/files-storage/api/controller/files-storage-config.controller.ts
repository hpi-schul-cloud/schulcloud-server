import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesStorageUC } from '../uc';
import { FilesStorageConfigResponse } from '../../domain';

@ApiTags('file/config')
@Controller('file/config')
export class FilesStorageConfigController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiOperation({ summary: 'Useable configuration for clients' })
	@ApiResponse({ status: 200, type: FilesStorageConfigResponse })
	@Get('/public')
	public publicConfig(): FilesStorageConfigResponse {
		const response = this.filesStorageUC.getPublicConfig();

		return response;
	}
}
