import { StrategyType } from '@infra/auth-guard';
import { Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { TldrawService } from '../service';
import { TldrawDeleteParams } from './tldraw.params';

@ApiTags('Tldraw Document')
@UseGuards(AuthGuard(StrategyType.API_KEY))
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
