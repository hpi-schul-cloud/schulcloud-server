/* istanbul ignore file */

import { Body, Controller, Get, Param, Post, Req, StreamableFile } from '@nestjs/common';
import { ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { FileRecord, ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileRecordResponse, FileDownloadDto, FileDto, FileMetaDto } from './dto';

@ApiTags('files-storage')
@Authenticate('jwt')
@Controller('files-storage')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiConsumes('multipart/form-data')
	@Post('upload/:schoolId/:targetType/:targetId')
	async uploadAsStream(
		@Body() _: FileDto,
		@Param() params: FileMetaDto,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request
	) {
		const res = await this.filesStorageUC.upload(currentUser.userId, params, req);

		const response = new FileRecordResponse(res as FileRecord);

		return response;
	}

	@ApiProperty({ type: String })
	@Get('/download/:fileRecordId/:fileName')
	async download(@Param() params: FileDownloadDto, @CurrentUser() currentUser: ICurrentUser) {
		const res = await this.filesStorageUC.download(currentUser.userId, params);
		// @TODO set headers ?
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `attachment; filename="${params.fileName}"`,
		});
	}
}
