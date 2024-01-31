import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { TldrawService } from '../service';
import { TldrawDeleteParams } from './tldraw.params';

@ApiTags('Tldraw Document')
@Controller('tldraw-document')
export class TldrawController {
	constructor(private readonly tldrawService: TldrawService) {}

	@ApiOperation({ summary: 'Delete every element of tldraw drawing by its docName.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':docName')
	async deleteByDocName(@Param() urlParams: TldrawDeleteParams) {
		await this.tldrawService.deleteByDocName(urlParams.docName);
	}
}
