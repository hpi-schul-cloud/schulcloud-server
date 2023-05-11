import { BadRequestException, Controller, ForbiddenException, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';

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
}
