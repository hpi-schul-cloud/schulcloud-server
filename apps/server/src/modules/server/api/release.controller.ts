import { ErrorResponse } from '@core/error/dto/error.response';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, ForbiddenException, Get, Query, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { PaginationParams } from '@shared/controller/dto';
import { ReleaseItemResponse, ReleaseListResponse } from './dto';
import { ReleaseUc } from './release.uc';

@ApiTags('Release')
@JwtAuthentication()
@Controller('releases')
export class ReleaseController {
	constructor(private readonly serverReleaseUc: ReleaseUc) {}

	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: ReleaseListResponse, description: 'Returns a list of releases.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Bad Request' })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('')
	public async getReleases(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<ReleaseListResponse> {
		const releases = await this.serverReleaseUc.getReleases(currentUser.userId, pagination.skip, pagination.limit);
		const items = releases.map((release) => new ReleaseItemResponse(release));
		const response = new ReleaseListResponse(items);

		return response;
	}
}
