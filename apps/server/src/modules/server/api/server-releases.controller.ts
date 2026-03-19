import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('releases')
export class ServerReleasesController {
	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: [String] })
	@Get('')
	public async getReleases(): Promise<string[]> {
		return await Promise.resolve(['v1.0.0', 'v1.1.0', 'v2.0.0']);
	}
}
