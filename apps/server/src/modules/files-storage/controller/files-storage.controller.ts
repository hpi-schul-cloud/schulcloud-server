/* istanbul ignore file */

import { Body, Controller, Get, Param, Post, Req, StreamableFile } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileRecord, ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileRecordResponse, DownloadFileParams, FileDto, UploadFileParams } from './dto';

@ApiTags('files-storage')
@Authenticate('jwt')
@Controller('files-storage')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiConsumes('multipart/form-data')
	@Post('upload/:schoolId/:targetType/:targetId')
	async uploadAsStream(
		@Body() _: FileDto,
		@Param() params: UploadFileParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request
	): Promise<FileRecordResponse> {
		const res = await this.filesStorageUC.upload(currentUser.userId, params, req);

		const response = new FileRecordResponse(res as FileRecord);

		return response;
	}

	@Get('/download/:fileRecordId/:fileName')
	async download(
		@Param() params: DownloadFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<StreamableFile> {
		const res = await this.filesStorageUC.download(currentUser.userId, params);
		// @TODO set headers ?
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `attachment; filename="${params.fileName}"`,
		});
	}
}
