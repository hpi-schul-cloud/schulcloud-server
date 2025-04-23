import { JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, ForbiddenException, InternalServerErrorException, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { DeleteByStorageLocationResponse, StorageLocationParamsDto } from '../dto';
import { FileRecordMapper } from '../mapper';
import { FilesStorageAdminUC } from '../uc';

@ApiTags('admin')
@JwtAuthentication()
@Controller('admin/file')
export class FilesStorageAdminController {
	constructor(private readonly filesStorageAdminUC: FilesStorageAdminUC) {}

	@ApiOperation({
		summary:
			'Mark all files of a storage location entityId for deletion. The files are permanently deleted after a certain time.',
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Delete('storage-location/:storageLocation/:storageLocationId')
	public async deleteByStorageLocation(
		@Param() params: StorageLocationParamsDto
	): Promise<DeleteByStorageLocationResponse> {
		const result = await this.filesStorageAdminUC.deleteByStorageLocation(params);

		const response = FileRecordMapper.mapToDeleteByStorageLocationResponse(params, result);

		return response;
	}
}
