import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReleaseService } from '../domain';
import { ReleaseItemResponse, ReleaseListResponse } from './dto';

@Controller('releases')
export class ServerReleaseController {
	constructor(private readonly releaseService: ReleaseService) {}

	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: ReleaseListResponse })
	@Get('')
	public async getReleases(): Promise<ReleaseListResponse> {
		const releases = await this.releaseService.getAllReleases();
		const items = releases.map((release) => new ReleaseItemResponse(release));
		const response = new ReleaseListResponse(items);

		return response;
	}
}
