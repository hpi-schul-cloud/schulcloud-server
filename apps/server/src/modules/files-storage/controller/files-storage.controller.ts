import { Body, Controller, Get, Param, Patch, Post, Query, Req, StreamableFile } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PaginationQuery } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { FileRecordUC } from '../uc/file-record.uc';
import { FilesStorageUC } from '../uc/files-storage.uc';
import {
	FileRecordResponse,
	DownloadFileParams,
	FileParams,
	FileRecordParams,
	FileRecordListResponse,
	SingleFileParams,
	RenameFileParams,
} from './dto';

@ApiTags('file')
@Authenticate('jwt')
@Controller('file')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC, private readonly fileRecordUC: FileRecordUC) {}

	@ApiConsumes('multipart/form-data')
	@Post('/upload/:schoolId/:parentType/:parentId')
	async upload(
		@Body() _: FileParams,
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request
	): Promise<FileRecordResponse> {
		const res = await this.filesStorageUC.upload(currentUser.userId, params, req);

		const response = new FileRecordResponse(res);

		return response;
	}

	@Get('/download/:fileRecordId/:fileName')
	async download(
		@Param() params: DownloadFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<StreamableFile> {
		const res = await this.filesStorageUC.download(currentUser.userId, params);
		// TODO set headers ?
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `inline; filename="${params.fileName}"`,
		});
	}

	@Get('/list/:schoolId/:parentType/:parentId')
	async list(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.fileRecordUC.fileRecordsOfParent(currentUser.userId, params);

		const responseFileRecords = fileRecords.map((fileRecord) => {
			return new FileRecordResponse(fileRecord);
		});

		const { skip, limit } = paginationQuery;

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);

		return response;
	}

	@Patch('/rename/:fileRecordId/')
	async patchFilename(
		@Param() params: SingleFileParams,
		@Body() renameFileDto: RenameFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const res = await this.fileRecordUC.patchFilename(currentUser.userId, params, renameFileDto);

		const response = new FileRecordResponse(res);

		return response;
	}
}
