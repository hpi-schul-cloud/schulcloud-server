import { ErrorResponse } from '@core/error/dto/error.response';
import { JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { PaginationParams } from '@shared/controller/dto';
import { ReleaseService } from '../domain';
import { ReleaseItemResponse, ReleaseListResponse } from './dto';

@ApiTags('Release')
@JwtAuthentication()
@Controller('releases')
export class ServerReleaseController {
	constructor(private readonly releaseService: ReleaseService) {}

	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: ReleaseListResponse, description: 'Returns a list of rooms.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Bad Request' })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('')
	public async getReleases(@Query() pagination: PaginationParams): Promise<ReleaseListResponse> {
		const releases = await this.releaseService.getReleases(pagination.skip, pagination.limit);
		const items = releases.map((release) => new ReleaseItemResponse(release));
		const response = new ReleaseListResponse(items);

		return response;
	}
}
