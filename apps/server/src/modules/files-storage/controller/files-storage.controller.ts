import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Headers,
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
	UnprocessableEntityException,
	UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError, RequestLoggingInterceptor } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { Request, Response } from 'express';
import { GetFileResponse } from '../interface';
import { FileRecordMapper, FilesStorageMapper } from '../mapper';
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
	PreviewParams,
	RenameFileParams,
	SingleFileParams,
} from './dto';

@ApiTags('file')
@JwtAuthentication()
@Controller('file')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiOperation({ summary: 'Upload file from url' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/upload-from-url/:storageLocation/:storageLocationId/:parentType/:parentId')
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
	@Post('/upload/:storageLocation/:storageLocationId/:parentType/:parentId')
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
	@ApiHeader({ name: 'Range', required: false })
	@Get('/download/:fileRecordId/:fileName')
	async download(
		@Param() params: DownloadFileParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response,
		@Headers('Range') bytesRange?: string
	): Promise<StreamableFile> {
		const fileResponse = await this.filesStorageUC.download(params, bytesRange);

		const streamableFile = this.streamFileToClient(req, fileResponse, response, bytesRange);

		return streamableFile;
	}

	@ApiOperation({ summary: 'Streamable download of a preview file.' })
	@ApiResponse({ status: 200, type: StreamableFile })
	@ApiResponse({ status: 206, type: StreamableFile })
	@ApiResponse({ status: 304, description: 'Not Modified' })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 422, type: UnprocessableEntityException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@ApiHeader({ name: 'Range', required: false })
	@ApiHeader({ name: 'If-None-Match', required: false })
	@Get('/preview/:fileRecordId/:fileName')
	async downloadPreview(
		@Param() params: DownloadFileParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() previewParams: PreviewParams,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response,
		@Headers('Range') bytesRange?: string,
		@Headers('If-None-Match') etag?: string
	): Promise<StreamableFile | void> {
		const fileResponse = await this.filesStorageUC.downloadPreview(
			currentUser.userId,
			params,
			previewParams,
			bytesRange
		);

		response.set({ ETag: fileResponse.etag });

		if (etag === fileResponse.etag) {
			response.status(HttpStatus.NOT_MODIFIED);

			return undefined;
		}

		const streamableFile = this.streamFileToClient(req, fileResponse, response, bytesRange);

		return streamableFile;
	}

	private streamFileToClient(
		req: Request,
		fileResponse: GetFileResponse,
		httpResponse: Response,
		bytesRange?: string
	): StreamableFile {
		req.on('close', () => fileResponse.data.destroy());

		// If bytes range has been defined, set Accept-Ranges and Content-Range HTTP headers
		// in a response and also set 206 Partial Content HTTP status code to inform the caller
		// about the partial data stream. Otherwise, just set a 200 OK HTTP status code.
		if (bytesRange) {
			httpResponse.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': fileResponse.contentRange,
			});

			httpResponse.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			httpResponse.status(HttpStatus.OK);
		}

		const streamableFile = FilesStorageMapper.mapToStreamableFile(fileResponse);

		return streamableFile;
	}

	@ApiOperation({ summary: 'Get a list of file meta data of a parent entityId.' })
	@ApiResponse({ status: 200, type: FileRecordListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get('/list/:storageLocation/:storageLocationId/:parentType/:parentId')
	async list(
		@Param() params: FileRecordParams,
		@Query() pagination: PaginationParams
	): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.getFileRecordsOfParent(params);
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
		@Body() renameFileParam: RenameFileParams
	): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.patchFilename(params, renameFileParam);

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
	@Delete('/delete/:storageLocation/:storageLocationId/:parentType/:parentId')
	@UseInterceptors(RequestLoggingInterceptor)
	async deleteByParent(@Param() params: FileRecordParams): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.deleteFilesOfParent(params);
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
	async deleteFile(@Param() params: SingleFileParams): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.deleteOneFile(params);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Restore all files of a parent entityId that are marked for deletion.' })
	@ApiResponse({ status: 201, type: FileRecordListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Post('/restore/:storageLocation/:storageLocationId/:parentType/:parentId')
	async restore(@Param() params: FileRecordParams): Promise<FileRecordListResponse> {
		const [fileRecords, total] = await this.filesStorageUC.restoreFilesOfParent(params);

		const response = FileRecordMapper.mapToFileRecordListResponse(fileRecords, total);

		return response;
	}

	@ApiOperation({ summary: 'Restore a single file that is marked for deletion.' })
	@ApiResponse({ status: 201, type: FileRecordResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Post('/restore/:fileRecordId')
	async restoreFile(@Param() params: SingleFileParams): Promise<FileRecordResponse> {
		const fileRecord = await this.filesStorageUC.restoreOneFile(params);

		const response = FileRecordMapper.mapToFileRecordResponse(fileRecord);

		return response;
	}

	@ApiOperation({ summary: 'Copy all files of a parent entityId to a target entitId' })
	@ApiResponse({ status: 201, type: CopyFileListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/copy/:storageLocation/:storageLocationId/:parentType/:parentId')
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
