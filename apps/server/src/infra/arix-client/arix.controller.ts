import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArixTestClient } from './arix-test-client';
import { ArixSearchResponse } from './response/arix-search-response';

@ApiTags('Arix')
@Controller('arix')
export class ArixController {
	constructor(private readonly arixRestClient: ArixTestClient) {}

	@Get('records')
	public async test(): Promise<string> {
		await this.arixRestClient.getMediaRecord();
		return 'Hello world';
	}

	@Get('search')
	public async search(): Promise<ArixSearchResponse> {
		return this.arixRestClient.doSearch();
	}
}
