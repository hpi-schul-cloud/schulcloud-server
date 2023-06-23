import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { AncestorListResolverService } from '../service/ancestor-list-resolver.service';
import { AncestorListUrlParams } from './dto';
import { AncestorResponse } from './dto/ancestor.response';

@ApiTags('AncestorList')
@Authenticate('jwt')
@Controller('ancestor-list')
export class AncestorListController {
	constructor(private readonly ancestorListResolverService: AncestorListResolverService) {}

	@ApiOperation({
		summary:
			'Get list of ancestors (parent and parent-of-parent and ...) for a specific entity. Useful for e.g. breadcrumbs.',
	})
	@ApiResponse({ status: 200, type: [AncestorResponse] })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get('/:entityType/:entityId')
	async getAncestorsOf(
		@Param() urlParams: AncestorListUrlParams
		// @CurrentUser() currentUser: ICurrentUser
	): Promise<AncestorResponse[]> {
		const { entityId, entityType } = urlParams;
		const ancestors = await this.ancestorListResolverService.getAncestorsOf(entityType, entityId);

		return ancestors;
	}
}
