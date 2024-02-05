import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	Param,
	Post,
	Query,
	Res,
} from '@nestjs/common';
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
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Search for media records' })
	@ApiOkResponse({ description: 'The search was successful', type: ArixSearchResponse })
	@ApiInternalServerErrorResponse({ description: 'An error occurred during the search' })
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
	@ApiOkResponse({ description: 'The media record was found', type: ArixRecordResponse })
	@ApiInternalServerErrorResponse({ description: 'An error occurred during getting the media record' })
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

		if (arixRecordResponse.error) {
			throw new InternalServerErrorException(arixRecordResponse.error);
		}

		this.setPerformanceHeader(res, startTime);

		return arixRecordResponse;
	}

	@Get('records/:identifier/link')
	@ApiOperation({ summary: 'Get a media record link' })
	@ApiOkResponse({ description: 'The media record link was found', type: ArixLinkResponse })
	@ApiInternalServerErrorResponse({ description: 'An error occurred during getting the media record link.' })
	public async media(
		@Param() pathParams: ArixRecordRequestPathParams,
		@Res({ passthrough: true }) res: Response
	): Promise<ArixLinkResponse> {
		const startTime: number = performance.now();

		const arixLinkResponse: ArixLinkResponse = await this.arixRestClient.getMediaLink(pathParams.identifier);

		this.setPerformanceHeader(res, startTime);

		return arixLinkResponse;
	}

	@Get('records/:identifier/logo')
	@ApiOperation({ summary: 'Get the logo of an media record' })
	@ApiOkResponse({
		description: 'The logo fetching was successful. It is empty when there is no logo available.',
		type: ArixLogoResponse,
	})
	@ApiInternalServerErrorResponse({ description: 'An error occurred during getting the logo' })
	public async logo(
		@Param() pathParams: ArixRecordRequestPathParams,
		@Res({ passthrough: true }) res: Response
	): Promise<ArixLogoResponse> {
		const startTime: number = performance.now();

		const arixLogoResponse: ArixLogoResponse = await this.arixRestClient.getRecordLogo(pathParams.identifier);

		this.setPerformanceHeader(res, startTime);

		return arixLogoResponse;
	}

	private setPerformanceHeader(res: Response, startTime: number): void {
		const executionTime: number = performance.now() - startTime;
		const seconds: number = executionTime / 1000;

		res.setHeader('X-Response-Time', `${seconds} seconds.`);
	}
}
