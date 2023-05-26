import {
	BadRequestException,
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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';

import { H5PEditorUc } from '../uc/h5p.uc';
import { GetH5PAjaxParams } from './dto/h5p-ajax.params';
import { GetH5PContentFileParams } from './dto/h5p-content-file.params';
import { GetH5PLibraryFileParams } from './dto/h5p-library-file.params';
import { GetH5PStaticCoreFileParams, GetH5PStaticEditorCoreFileParams } from './dto/h5p-static-files.params';

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
	@Get('/:contentId/play')
	async getPlayer() {
		// Dummy Response
		return Promise.resolve(dummyResponse('H5P Player Dummy'));
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
	async getLibraryFile(@Param() params: GetH5PLibraryFileParams) {
		const { data, contentType, contentLength } = await this.h5pEditorUc.getLibraryFile(params.ubername, params.file);

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('content/:id')
	async getContentParameters(@Param('id') id: string) {
		return Promise.resolve(`Content ID: ${id}`);
	}

	@Get('content/:id/:file(*)')
	async getContentFile(@Param() params: GetH5PContentFileParams, @Req() req: Request, @Res() res: Response) {
		const { data, contentType, contentLength, contentRange } = await this.h5pEditorUc.getContentFile(
			params.id,
			params.file,
			req
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

		return new StreamableFile(data, { type: contentType, length: contentLength });
	}

	@Get('temporary/:file')
	async getTemporaryFile(@Param('file') file: string) {
		return Promise.resolve(`Temporary File ID: ${file}`);
	}

	@Get('ajax')
	async getAjax(@Query() query: GetH5PAjaxParams) {
		const response = this.h5pEditorUc.getAjax(
			query.action,
			query.machineName,
			query.majorVersion,
			query.minorVersion,
			query.language
		);

		return response;
	}

	@Post('ajax')
	async postAjax(@Req() req: Request) {
		// Query
		// - action
		// - language?
		// - id
		// - hubId

		// Body
		// - files
		const result = await this.h5pEditorUc.postAjax('');

		return result;
	}

	@Get('core/:file(*)')
	async getCoreFiles(@Param() params: GetH5PStaticCoreFileParams) {
		// Static files?
		return Promise.resolve(`Test: ${JSON.stringify(params)}`);
	}

	@Get('editor/:ubername/:file(*)')
	async getEditorCoreFiles(@Param() params: GetH5PStaticEditorCoreFileParams) {
		// Static files?
		return Promise.resolve(`Test: ${JSON.stringify(params)}`);
	}
}
