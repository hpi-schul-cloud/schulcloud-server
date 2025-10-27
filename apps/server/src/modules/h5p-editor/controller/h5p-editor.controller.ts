import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { AjaxSuccessResponse, IEditorModel, IPlayerModel } from '@lumieducation/h5p-server';
import {
	IAjaxResponse,
	IHubInfo,
	ILibraryDetailedDataForClient,
	ILibraryOverviewForClient,
} from '@lumieducation/h5p-server/build/src/types';
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	InternalServerErrorException,
	Param,
	Post,
	Query,
	Req,
	Res,
	UploadedFiles,
	UseFilters,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { Request } from 'express';
import { H5PEditorUc } from '../uc';

import {
	AjaxGetQueryParams,
	AjaxPostBodyParams,
	AjaxPostQueryParams,
	ContentFileUrlParams,
	GetH5PContentParams,
	GetH5PEditorParams,
	GetH5PEditorParamsCreate,
	H5PContentResponse,
	H5PEditorModelContentResponse,
	H5PEditorModelResponse,
	H5PSaveResponse,
	LibraryFileUrlParams,
	PostH5PContentCreateParams,
	SaveH5PEditorParams,
} from './dto';
import { AjaxPostBodyParamsTransformPipe } from './dto/ajax/post.body.params.transform-pipe';
import { H5pAjaxErrorResponseFilter } from './filter';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';

// Simple per-user in-memory rate limit for import endpoint
const _h5pImportRate = new Map<string, { count: number; reset: number }>();
const _IMPORT_LIMIT = 5; // 5 requests per minute
const _IMPORT_WINDOW_MS = 60_000;

@ApiTags('h5p-editor')
@JwtAuthentication()
@Controller('h5p-editor')
export class H5PEditorController {
	constructor(private h5pEditorUc: H5PEditorUc) {}

	@ApiOperation({ summary: 'Return dummy HTML for testing' })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/play/:contentId')
	public async getPlayer(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: GetH5PContentParams
	): Promise<IPlayerModel> {
		return this.h5pEditorUc.getH5pPlayer(currentUser.userId, params.contentId);
	}

	// Other Endpoints (incomplete list), paths not final
	// - getLibrary     			(e.g. GET `/libraries/:uberName/:file(*)`)
	// - getContentFile 			(e.g. GET `/content/:contentId/:file(*)`)
	// - getTempFile    			(e.g. GET `/temp/:file(*)`)
	// - ajax endpoint for h5p 		(e.g. GET/POST `/ajax/*`)
	// - static files from h5p-core	(e.g. GET `/core/*`)
	// - static files for editor	(e.g. GET `/editor/*`)

	@Get('libraries/:ubername/:file(*)')
	public async getLibraryFile(@Param() params: LibraryFileUrlParams, @Req() req: Request): Promise<StreamableFile> {
		const { data, contentType, contentLength } = await this.h5pEditorUc.getLibraryFile(params.ubername, params.file);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('params/:id')
	public async getContentParameters(
		@Param('id') id: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<H5PContentResponse> {
		const content: H5PContentResponse = await this.h5pEditorUc.getContentParameters(id, currentUser.userId);

		return content;
	}

	@Get('content/:id/:filename(*)')
	public async getContentFile(
		@Param() params: ContentFileUrlParams,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<StreamableFile> {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getContentFile(
			params.id,
			params.filename,
			req,
			currentUser.userId
		);

		H5PEditorController.setRangeResponseHeaders(res, contentLength, contentRange);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('temp-files/:file(*)')
	public async getTemporaryFile(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('file') file: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getTemporaryFile(
			file,
			req,
			currentUser.userId
		);

		H5PEditorController.setRangeResponseHeaders(res, contentLength, contentRange);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('ajax')
	@UseFilters(H5pAjaxErrorResponseFilter)
	public async getAjax(
		@Query() query: AjaxGetQueryParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<IHubInfo | ILibraryDetailedDataForClient | IAjaxResponse | undefined> {
		const response = this.h5pEditorUc.getAjax(query, currentUser.userId);

		return response;
	}

	@Post('ajax')
	@UseFilters(H5pAjaxErrorResponseFilter)
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: 'file', maxCount: 1 },
			{ name: 'h5p', maxCount: 1 },
		])
	)
	public async postAjax(
		@Body(AjaxPostBodyParamsTransformPipe) body: AjaxPostBodyParams,
		@Query() query: AjaxPostQueryParams,
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFiles() files?: { file?: Express.Multer.File[]; h5p?: Express.Multer.File[] }
	): Promise<
		| AjaxSuccessResponse
		| {
				height?: number;
				mime: string;
				path: string;
				width?: number;
		  }
		| ILibraryOverviewForClient[]
		| undefined
	> {
		const contentFile = files?.file?.[0];
		const h5pFile = files?.h5p?.[0];

		const result = await this.h5pEditorUc.postAjax(currentUser.userId, query, body, contentFile, h5pFile);

		return result;
	}

	@Post('/delete/:contentId')
	public async deleteH5pContent(
		@Param() params: GetH5PContentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		const deleteSuccessfull: boolean = await this.h5pEditorUc.deleteH5pContent(currentUser.userId, params.contentId);

		return deleteSuccessfull;
	}

	@Get('/edit/:language')
	@ApiResponse({ status: 200, type: H5PEditorModelResponse })
	public async getNewH5PEditor(
		@Param() params: GetH5PEditorParamsCreate,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<H5PEditorModelResponse> {
		const editorModel: IEditorModel = await this.h5pEditorUc.getEmptyH5pEditor(currentUser.userId, params.language);

		return new H5PEditorModelResponse(editorModel);
	}

	@Get('/edit/:contentId/:language')
	@ApiResponse({ status: 200, type: H5PEditorModelContentResponse })
	public async getH5PEditor(
		@Param() params: GetH5PEditorParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<H5PEditorModelContentResponse> {
		const { editorModel, content } = await this.h5pEditorUc.getH5pEditor(
			currentUser.userId,
			params.contentId,
			params.language
		);

		return new H5PEditorModelContentResponse(editorModel, content);
	}

	@Post('/edit')
	@ApiResponse({ status: 201, type: H5PSaveResponse })
	public async createH5pContent(
		@Body() body: PostH5PContentCreateParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<H5PSaveResponse> {
		const response = await this.h5pEditorUc.createH5pContentGetMetadata(
			currentUser.userId,
			currentUser.schoolId,
			body.params.params,
			body.params.metadata,
			body.library,
			body.parentType,
			body.parentId
		);

		const saveResponse = new H5PSaveResponse(response.id, response.metadata);

		return saveResponse;
	}

	@Post('/edit/:contentId')
	@ApiResponse({ status: 201, type: H5PSaveResponse })
	public async saveH5pContent(
		@Body() body: PostH5PContentCreateParams,
		@Param() params: SaveH5PEditorParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<H5PSaveResponse> {
		const response = await this.h5pEditorUc.saveH5pContentGetMetadata(
			params.contentId,
			currentUser.userId,
			currentUser.schoolId,
			body.params.params,
			body.params.metadata,
			body.library,
			body.parentType,
			body.parentId
		);

		const saveResponse = new H5PSaveResponse(response.id, response.metadata);

		return saveResponse;
	}

	private static setRangeResponseHeaders(
		res: Response,
		contentLength: number,
		range?: { start: number; end: number }
	): void {
		if (range) {
			const contentRangeHeader = `bytes ${range.start}-${range.end}/${contentLength}`;

			res.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': contentRangeHeader,
			});

			res.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			res.status(HttpStatus.OK);
		}
	}
	/**
	 * DOWNLOAD/EXPORT: GET /h5p-editor/download/:contentId
	 */
	@Get('/download/:contentId')
	public async downloadH5p(
		@Param('contentId') contentId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const rs = await this.h5pEditorUc.streamH5pPackage(contentId, currentUser.userId);
		const filename = `h5p-${contentId}.h5p`;
		res.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store',
		});
		// Ensure rs is a Node.js Readable stream
		return new StreamableFile(rs);
	}

	/**
	 * IMPORT (PoC): POST /h5p-editor/import (multipart/form-data, field 'h5p')
	 * Rate-limited per user.
	 */
	@Post('/import')
	@UseInterceptors(
		FileInterceptor('h5p', {
			limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
			fileFilter: (_req, file, cb) => {
				if (file.originalname && file.originalname.toLowerCase().endsWith('.h5p')) return cb(null, true);
				return cb(new BadRequestException('Please upload a .h5p file in field "h5p"'), false);
			},
		})
	)
	public async importH5pPoC(
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() currentUser: ICurrentUser,
		@Res({ passthrough: true }) res: Response
	): Promise<
		| AjaxSuccessResponse
		| {
				height?: number;
				mime: string;
				path: string;
				width?: number;
		  }
		| ILibraryOverviewForClient[]
		| undefined
		| { message: string }
	> {
		// simple per-user rate limit
		const now = Date.now();
		const id = String(currentUser.userId);
		const entry = _h5pImportRate.get(id) || { count: 0, reset: now + _IMPORT_WINDOW_MS };
		if (now > entry.reset) {
			entry.count = 0;
			entry.reset = now + _IMPORT_WINDOW_MS;
		}
		entry.count += 1;
		_h5pImportRate.set(id, entry);
		if (entry.count > _IMPORT_LIMIT) {
			res.status(HttpStatus.TOO_MANY_REQUESTS);
			return { message: 'Too many import requests. Please try again later.' };
		}
		if (!file) {
			res.status(HttpStatus.BAD_REQUEST);
			return { message: 'Please upload a .h5p file in field "h5p".' };
		}
		const result = await this.h5pEditorUc.importH5pPackagePoC(currentUser.userId, file);
		res.status(HttpStatus.OK);
		return result;
	}
}
