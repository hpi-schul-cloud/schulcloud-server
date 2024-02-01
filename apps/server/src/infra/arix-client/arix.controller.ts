import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ArixTestClient } from './arix-test-client';
import { ArixRecordResponse } from './response/arix-record-response';
import { ArixSearchResponse } from './response/arix-search-response';

@ApiTags('Arix')
@Controller('arix')
export class ArixController {
	constructor(private readonly arixRestClient: ArixTestClient) {}

	@Get('records')
	public async record(@Res({ passthrough: true }) res: Response): Promise<ArixRecordResponse> {
		const startTime: number = performance.now();

		const arixRecordResponse: ArixRecordResponse = await this.arixRestClient.getMediaRecord();

		this.setPerformanceHeader(res, startTime);

		return arixRecordResponse;
	}

	@Get('search')
	public async search(@Res({ passthrough: true }) res: Response): Promise<ArixSearchResponse> {
		const startTime: number = performance.now();

		const arixSearchResponsePromise: ArixSearchResponse = await this.arixRestClient.doSearch();

		this.setPerformanceHeader(res, startTime);

		return arixSearchResponsePromise;
	}

	private setPerformanceHeader(res: Response, startTime: number): void {
		const executionTime: number = performance.now() - startTime;
		const seconds: number = executionTime / 1000;

		res.setHeader('X-Response-Time', `${seconds} seconds.`);
	}
}
