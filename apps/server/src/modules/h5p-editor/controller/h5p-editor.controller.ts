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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';

import { H5PEditorUc } from '../uc/h5p.uc';

import {
	AjaxGetQueryParams,
	AjaxPostBodyParams,
	AjaxPostBodyParamsFilesInterceptor,
	AjaxPostBodyParamsTransformPipe,
	AjaxPostQueryParams,
	ContentFileUrlParams,
	GetH5PContentParams,
	LibraryFileUrlParams,
	PostH5PContentCreateParams,
} from './dto';

// Dummy html response so we can test i-frame integration
const dummyResponse = (title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body>
    <h1>${title}</h1>
    <p>This response can be used for testing</p>
</body>
</html>
`;

@ApiTags('h5p-editor')
@Authenticate('jwt')
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
		// Dummy Response
		// return Promise.resolve(dummyResponse('H5P Player Dummy'));
	}

	@ApiOperation({ summary: 'Return dummy HTML for testing' })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/:contentId/edit')
	async getEditor() {
		// Dummy Response
		return Promise.resolve(dummyResponse('H5P Editor Dummy'));
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

	@Get('params/:id/:file(*)')
	async getContentFile(
		@Param() params: ContentFileUrlParams,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getContentFile(
			params.id,
			params.file,
			req,
			currentUser
		);

		if (contentRange) {
			const contentRangeHeader = `bytes ${contentRange.start}-${contentRange.end}/${contentLength}`;

			res.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': contentRangeHeader,
			});

			res.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			res.status(HttpStatus.OK);
		}

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

		if (contentRange) {
			const contentRangeHeader = `bytes ${contentRange.start}-${contentRange.end}/${contentLength}`;

			res.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': contentRangeHeader,
			});

			res.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			res.status(HttpStatus.OK);
		}

		req.on('close', () => data.destroy());

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('ajax')
	async getAjax(@Query() query: AjaxGetQueryParams, @CurrentUser() currentUser: ICurrentUser) {
		const response = this.h5pEditorUc.getAjax(query, currentUser);
		return response;
	}

	@Post('ajax')
	@UseInterceptors(AjaxPostBodyParamsFilesInterceptor)
	async postAjax(
		@Body(AjaxPostBodyParamsTransformPipe) body: AjaxPostBodyParams,
		@Query() query: AjaxPostQueryParams,
		@UploadedFiles() files: Express.Multer.File[],
		@CurrentUser() currentUser: ICurrentUser
	) {
		const result = await this.h5pEditorUc.postAjax(currentUser, query, body, files);
		return result;
	}

	@Get('/create')
	async createNewEditor(@CurrentUser() currentUser: ICurrentUser): Promise<string> {
		// Todo: Get user language
		const response = this.h5pEditorUc.createH5PEditor(currentUser, 'de');
		return response;
	}

	@Post('/create')
	async createNewContent(@Body() body: PostH5PContentCreateParams, @CurrentUser() currentUser: ICurrentUser) {
		// Todo: Move to UC
		const response = await this.h5pEditorUc.saveH5pContentGetMetadata(
			currentUser,
			body.params.params,
			body.params.metadata,
			body.library
		);

		return response;
	}

	@Get('/edit-h5p/:contentId')
	async editH5pContent(
		@Param() params: GetH5PContentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<string> {
		// Todo: Get user language
		const response = this.h5pEditorUc.editH5pContent(currentUser, params.contentId, 'de');
		return response;
	}

	@Post('/delete/:contentId')
	async deleteH5pContent(
		@Param() params: GetH5PContentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		const deleteSuccessfull = this.h5pEditorUc.deleteH5pContent(currentUser, params.contentId);

		return deleteSuccessfull;
	}

	@Post('/edit-h5p/:contentId')
	async saveH5pContent(
		@Body() body: PostH5PContentCreateParams,
		@Param() params: GetH5PContentParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<string> {
		/*
		const newContentId = this.h5pEditorUc.saveH5pContent(
			currentUser,
			params.contentId,
			params.params,
			params.metadata,
			params.mainLibraryUbername
		);
		*/
		// return newContentId;
		const response = await this.h5pEditorUc.saveH5pContent(
			currentUser,
			params.contentId,
			body.params.params,
			body.params.metadata,
			body.library
		);

		return response;
	}
}
