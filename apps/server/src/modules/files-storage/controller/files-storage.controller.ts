import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	StreamableFile,
	UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RequestLoggingInterceptor } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { FileRecordUC } from '../uc/file-record.uc';
import { FilesStorageUC } from '../uc/files-storage.uc';
import {
	CopyFileParams,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	RenameFileParams,
	SingleFileParams,
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
		@Query() pagination: PaginationParams
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.fileRecordUC.fileRecordsOfParent(currentUser.userId, params);

		const responseFileRecords = fileRecords.map((fileRecord) => {
			return new FileRecordResponse(fileRecord);
		});

		const { skip, limit } = pagination;

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);

		return response;
	}

	@Patch('/rename/:fileRecordId/')
	@UseInterceptors(RequestLoggingInterceptor)
	async patchFilename(
		@Param() params: SingleFileParams,
		@Body() renameFileParam: RenameFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const res = await this.fileRecordUC.patchFilename(currentUser.userId, params, renameFileParam);

		const response = new FileRecordResponse(res);

		return response;
	}

	@Delete('/delete/:schoolId/:parentType/:parentId')
	@UseInterceptors(RequestLoggingInterceptor)
	async delete(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.deleteFilesOfParent(currentUser.userId, params);

		const responseFileRecords = fileRecords.map((fileRecord) => {
			return new FileRecordResponse(fileRecord);
		});

		const response = new FileRecordListResponse(responseFileRecords, total);

		return response;
	}

	@Delete('/delete/:fileRecordId')
	@UseInterceptors(RequestLoggingInterceptor)
	async deleteFile(
		@Param() params: SingleFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.deleteOneFile(currentUser.userId, params);

		const response = new FileRecordResponse(fileRecord);

		return response;
	}

	@Post('/restore/:schoolId/:parentType/:parentId')
	async restore(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.restoreFilesOfParent(currentUser.userId, params);

		const responseFileRecords = fileRecords.map((fileRecord) => {
			return new FileRecordResponse(fileRecord);
		});

		const response = new FileRecordListResponse(responseFileRecords, total);

		return response;
	}

	@Post('/restore/:fileRecordId')
	async restoreFile(
		@Param() params: SingleFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.restoreOneFile(currentUser.userId, params);

		const response = new FileRecordResponse(fileRecord);

		return response;
	}

	@Post('/copy/:schoolId/:parentType/:parentId')
	async copy(
		@Param() params: FileRecordParams,
		@Body() copyFilesParam: CopyFilesOfParentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.copyFilesOfParent(
			currentUser.userId,
			params,
			copyFilesParam
		);

		const responseFileRecords = fileRecords.map((fileRecord) => {
			return new FileRecordResponse(fileRecord);
		});

		const response = new FileRecordListResponse(responseFileRecords, total);

		return response;
	}

	@Post('/copy/:fileRecordId')
	async copyFile(
		@Param() params: SingleFileParams,
		@Body() copyFileParam: CopyFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.copyOneFile(currentUser.userId, params, copyFileParam);

		const response = new FileRecordResponse(fileRecord);

		return response;
	}
}
