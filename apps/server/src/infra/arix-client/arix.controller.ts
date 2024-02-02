import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ArixRestClient } from './arix-rest-client';
import { ArixRecordRequestQueryParams, ArixSearchRequestParams } from './request';
import { ArixRecordRequestPathParams } from './request/arix-record-request-path-params';
import { ArixLinkResponse, ArixLogoResponse, ArixRecordResponse, ArixSearchResponse } from './response';

@ApiTags('Arix')
@Controller('arix')
export class ArixController {
	constructor(private readonly arixRestClient: ArixRestClient) {}

	@Post('search')
	@ApiOperation({ summary: 'Search for media records' })
	@ApiOkResponse()
	@ApiInternalServerErrorResponse()
	public async search(
		@Body() params: ArixSearchRequestParams,
		@Res({ passthrough: true }) res: Response
	): Promise<ArixSearchResponse> {
		const startTime: number = performance.now();

		const arixSearchResponse: ArixSearchResponse = await this.arixRestClient.search(params);

		this.setPerformanceHeader(res, startTime);

		return arixSearchResponse;
	}

	@Get('records/:identifier')
	@ApiOperation({ summary: 'Get a media record' })
	@ApiOkResponse()
	@ApiInternalServerErrorResponse()
	public async record(
		@Param() pathParams: ArixRecordRequestPathParams,
		@Query() queryParams: ArixRecordRequestQueryParams,
		@Res({ passthrough: true }) res: Response
	): Promise<ArixRecordResponse> {
		const startTime: number = performance.now();

		const arixRecordResponse: ArixRecordResponse = await this.arixRestClient.getMediaRecord(
			pathParams.identifier,
			queryParams.template
		);

		this.setPerformanceHeader(res, startTime);

		return arixRecordResponse;
	}

	@Get('link')
	public async media(@Res({ passthrough: true }) res: Response): Promise<ArixLinkResponse> {
		const startTime: number = performance.now();

		const arixLinkResponse: ArixLinkResponse = await this.arixRestClient.getMediaLink();

		this.setPerformanceHeader(res, startTime);

		return arixLinkResponse;
	}

	@Get('logo')
	public async logo(@Res({ passthrough: true }) res: Response): Promise<ArixLogoResponse> {
		const startTime: number = performance.now();

		const arixLogoResponse: ArixLogoResponse = await this.arixRestClient.getRecordLogo();

		this.setPerformanceHeader(res, startTime);

		return arixLogoResponse;
	}

	private setPerformanceHeader(res: Response, startTime: number): void {
		const executionTime: number = performance.now() - startTime;
		const seconds: number = executionTime / 1000;

		res.setHeader('X-Response-Time', `${seconds} seconds.`);
	}
}
