import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
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
	StreamableFile,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Request, Response } from 'express';
import { H5PEditorUc } from '../uc/h5p.uc';

import {
	AjaxGetQueryParams,
	AjaxPostBodyParams,
	AjaxPostQueryParams,
	ContentFileUrlParams,
	GetH5PContentParams,
	GetH5PEditorParams,
	GetH5PEditorParamsCreate,
	LibraryFileUrlParams,
	PostH5PContentCreateParams,
	SaveH5PEditorParams,
} from './dto';
import { AjaxPostBodyParamsTransformPipe } from './dto/ajax/post.body.params.transform-pipe';
import { H5PEditorModelContentResponse, H5PEditorModelResponse, H5PSaveResponse } from './dto/h5p-editor.response';

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
	async getPlayer(@CurrentUser() currentUser: ICurrentUser, @Param() params: GetH5PContentParams) {
		return this.h5pEditorUc.getH5pPlayer(currentUser, params.contentId);
	}

	// Other Endpoints (incomplete list), paths not final
	// - getLibrary     			(e.g. GET `/libraries/:uberName/:file(*)`)
	// - getContentFile 			(e.g. GET `/content/:contentId/:file(*)`)
	// - getTempFile    			(e.g. GET `/temp/:file(*)`)
	// - ajax endpoint for h5p 		(e.g. GET/POST `/ajax/*`)
	// - static files from h5p-core	(e.g. GET `/core/*`)
	// - static files for editor	(e.g. GET `/editor/*`)

	@Get('libraries/:ubername/:file(*)')
	async getLibraryFile(@Param() params: LibraryFileUrlParams, @Req() req: Request) {
		const { data, contentType, contentLength } = await this.h5pEditorUc.getLibraryFile(params.ubername, params.file);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('params/:id')
	async getContentParameters(@Param('id') id: string, @CurrentUser() currentUser: ICurrentUser) {
		const content = await this.h5pEditorUc.getContentParameters(id, currentUser);

		return content;
	}

	@Get('content/:id/:filename(*)')
	async getContentFile(
		@Param() params: ContentFileUrlParams,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getContentFile(
			params.id,
			params.filename,
			req,
			currentUser
		);

		H5PEditorController.setRangeResponseHeaders(res, contentLength, contentRange);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('temp-files/:file(*)')
	async getTemporaryFile(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('file') file: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getTemporaryFile(
			file,
			req,
			currentUser
		);

		H5PEditorController.setRangeResponseHeaders(res, contentLength, contentRange);

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('ajax')
	async getAjax(@Query() query: AjaxGetQueryParams, @CurrentUser() currentUser: ICurrentUser) {
		const response = this.h5pEditorUc.getAjax(query, currentUser);

		return response;
	}

	@Post('ajax')
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: 'file', maxCount: 1 },
			{ name: 'h5p', maxCount: 1 },
		])
	)
	async postAjax(
		@Body(AjaxPostBodyParamsTransformPipe) body: AjaxPostBodyParams,
		@Query() query: AjaxPostQueryParams,
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFiles() files?: { file?: Express.Multer.File[]; h5p?: Express.Multer.File[] }
	) {
		const contentFile = files?.file?.[0];
		const h5pFile = files?.h5p?.[0];

		const result = await this.h5pEditorUc.postAjax(currentUser, query, body, contentFile, h5pFile);

		return result;
	}

	@Post('/delete/:contentId')
	async deleteH5pContent(
		@Param() params: GetH5PContentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		const deleteSuccessfull = this.h5pEditorUc.deleteH5pContent(currentUser, params.contentId);

		return deleteSuccessfull;
	}

	@Get('/edit/:language')
	@ApiResponse({ status: 200, type: H5PEditorModelResponse })
	async getNewH5PEditor(@Param() params: GetH5PEditorParamsCreate, @CurrentUser() currentUser: ICurrentUser) {
		const editorModel = await this.h5pEditorUc.getEmptyH5pEditor(currentUser, params.language);

		return new H5PEditorModelResponse(editorModel);
	}

	@Get('/edit/:contentId/:language')
	@ApiResponse({ status: 200, type: H5PEditorModelContentResponse })
	async getH5PEditor(@Param() params: GetH5PEditorParams, @CurrentUser() currentUser: ICurrentUser) {
		const { editorModel, content } = await this.h5pEditorUc.getH5pEditor(
			currentUser,
			params.contentId,
			params.language
		);

		return new H5PEditorModelContentResponse(editorModel, content);
	}

	@Post('/edit')
	@ApiResponse({ status: 201, type: H5PSaveResponse })
	async createH5pContent(@Body() body: PostH5PContentCreateParams, @CurrentUser() currentUser: ICurrentUser) {
		const response = await this.h5pEditorUc.createH5pContentGetMetadata(
			currentUser,
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
	async saveH5pContent(
		@Body() body: PostH5PContentCreateParams,
		@Param() params: SaveH5PEditorParams,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const response = await this.h5pEditorUc.saveH5pContentGetMetadata(
			params.contentId,
			currentUser,
			body.params.params,
			body.params.metadata,
			body.library,
			body.parentType,
			body.parentId
		);

		const saveResponse = new H5PSaveResponse(response.id, response.metadata);

		return saveResponse;
	}

	private static setRangeResponseHeaders(res: Response, contentLength: number, range?: { start: number; end: number }) {
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
}
