import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param } from '@nestjs/common';
import { TldrawService } from '@src/modules/tldraw/service/tldraw.service';
import { ApiValidationError } from '@shared/common';
import { TldrawDeleteParams } from '@src/modules/tldraw/controller/tldraw.params';

@ApiTags('Tldraw Document')
@Authenticate('jwt')
@Controller('tldraw-document')
export class TldrawController {
	constructor(private readonly tldrawService: TldrawService) {}

	@ApiOperation({ summary: 'Delete every element of tldraw drawing by his docName.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':docName')
	async deleteByDrawingName(@Param() urlParams: TldrawDeleteParams) {
		await this.tldrawService.deleteByDrawingName(urlParams.docName);
	}
}
