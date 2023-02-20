import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpStatus,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	Req,
	Res,
	StreamableFile,
	UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError, RequestLoggingInterceptor } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { FileRecordMapper } from '../mapper/file-record.mapper';
import { FilesStorageUC } from '../uc';
import {
	CopyFileListResponse,
	CopyFileParams,
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	FileUrlParams,
	RenameFileParams,
	SingleFileParams,
} from './dto';

@ApiTags('file')
@Authenticate('jwt')
@Controller('file')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiOperation({ summary: 'Upload file from url' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/upload-from-url/:schoolId/:parentType/:parentId')
	async uploadFromUrl(
		@Body() body: FileUrlParams,
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.uploadFromUrl(currentUser.userId, { ...body, ...params });

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Streamable upload of a binary file.' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@ApiConsumes('multipart/form-data')
	@Post('/upload/:schoolId/:parentType/:parentId')
	async upload(
		@Body() _: FileParams,
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.upload(currentUser.userId, params, req);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Streamable download of a binary file.' })
	@ApiResponse({ status: 200, type: StreamableFile })
	@ApiResponse({ status: 206, type: StreamableFile })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/download/:fileRecordId/:fileName')
	async download(
		@Param() params: DownloadFileParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile> {
		// Get Range HTTP header value to check if caller
		// requested either partial or full data stream.
		const bytesRange = req.header('Range');

		// Call download method with either defined or undefined bytes range.
		const res = await this.filesStorageUC.download(currentUser.userId, params, bytesRange);

		// Destroy the stream after it has been closed.
		req.on('close', () => res.data.destroy());

		// If bytes range has been defined, set Accept-Ranges and Content-Range HTTP headers
		// in a response and also set 206 Partial Content HTTP status code to inform the caller
		// about the partial data stream. Otherwise, just set a 200 OK HTTP status code.
		if (bytesRange) {
			response.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': res.contentRange,
			});

			response.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			response.status(HttpStatus.OK);
		}

		// Return StreamableFile with stream data and options that will additionally set
		// Content-Type, Content-Disposition and Content-Length headers in a response.
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `inline; filename="${encodeURI(params.fileName)}"`,
			length: res.contentLength,
		});
	}

	@ApiOperation({ summary: 'Get a list of file meta data of a parent entityId.' })
	@ApiResponse({ status: 200, type: FileRecordListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get('/list/:schoolId/:parentType/:parentId')
	async list(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.getFileRecordsOfParent(currentUser.userId, params);
		const { skip, limit } = pagination;
		const response = FileRecordMapper.mapToFileRecordListResponse(fileRecords, total, skip, limit);

		return response;
	}

	@ApiOperation({ summary: 'Rename a single file.' })
	@ApiResponse({ status: 200, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({
		status: 409,
		type: ConflictException,
		description: 'File with same name already exist in parent scope.',
	})
	@Patch('/rename/:fileRecordId/')
	@UseInterceptors(RequestLoggingInterceptor)
	async patchFilename(
		@Param() params: SingleFileParams,
		@Body() renameFileParam: RenameFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.patchFilename(currentUser.userId, params, renameFileParam);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({
		summary:
			'Mark all files of a parent entityId for deletion. The files are permanently deleted after a certain time.',
	})
	@ApiResponse({ status: 200, type: FileRecordListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Delete('/delete/:schoolId/:parentType/:parentId')
	@UseInterceptors(RequestLoggingInterceptor)
	async delete(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.deleteFilesOfParent(currentUser.userId, params);
		const response = FileRecordMapper.mapToFileRecordListResponse(fileRecords, total);

		return response;
	}

	@ApiOperation({ summary: 'Mark a single file for deletion. The files are permanently deleted after a certain time.' })
	@ApiResponse({ status: 200, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Delete('/delete/:fileRecordId')
	@UseInterceptors(RequestLoggingInterceptor)
	async deleteFile(
		@Param() params: SingleFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.deleteOneFile(currentUser.userId, params);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Restore all files of a parent entityId that are marked for deletion.' })
	@ApiResponse({ status: 201, type: FileRecordListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Post('/restore/:schoolId/:parentType/:parentId')
	async restore(
		@Param() params: FileRecordParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.restoreFilesOfParent(currentUser.userId, params);

		const response = FileRecordMapper.mapToFileRecordListResponse(fileRecords, total);

		return response;
	}

	@ApiOperation({ summary: 'Restore a single file that is marked for deletion.' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Post('/restore/:fileRecordId')
	async restoreFile(
		@Param() params: SingleFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.restoreOneFile(currentUser.userId, params);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Copy all files of a parent entityId to a target entitId' })
	@ApiResponse({ status: 201, type: CopyFileListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/copy/:schoolId/:parentType/:parentId')
	async copy(
		@Param() params: FileRecordParams,
		@Body() copyFilesParam: CopyFilesOfParentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CopyFileListResponse> {
		const [response, count] = await this.filesStorageUC.copyFilesOfParent(currentUser.userId, params, copyFilesParam);

		return new CopyFileListResponse(response, count);
	}

	@ApiOperation({ summary: 'Copy a single file in the same target entityId scope.' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/copy/:fileRecordId')
	async copyFile(
		@Param() params: SingleFileParams,
		@Body() copyFileParam: CopyFileParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CopyFileResponse> {
		const response = await this.filesStorageUC.copyOneFile(currentUser.userId, params, copyFileParam);

		return response;
	}
}
