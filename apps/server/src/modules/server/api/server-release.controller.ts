import { JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { ReleaseService } from '../domain';
import { ReleaseItemResponse, ReleaseListResponse } from './dto';

@ApiTags('Release')
@JwtAuthentication()
@Controller('releases')
export class ServerReleaseController {
	constructor(private readonly releaseService: ReleaseService) {}

	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: ReleaseListResponse })
	@Get('')
	public async getReleases(@Query() pagination: PaginationParams): Promise<ReleaseListResponse> {
		const releases = await this.releaseService.getReleases(pagination.skip, pagination.limit);
		const items = releases.map((release) => new ReleaseItemResponse(release));
		const response = new ReleaseListResponse(items);

		return response;
	}
}
