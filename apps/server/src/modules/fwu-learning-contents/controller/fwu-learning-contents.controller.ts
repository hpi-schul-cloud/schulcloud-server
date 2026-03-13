import { ErrorResponse } from '@core/error/dto/error.response';
import { JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	Get,
	HttpStatus,
	Inject,
	InternalServerErrorException,
	Param,
	Req,
	Res,
	StreamableFile,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { Request, Response } from 'express';
import { FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig } from '../fwu.config';
import { filesIndex } from '../fwu.filesIndex';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';
import { FwuListResponse } from './dto/fwu-list.response';
import { FwuMapper } from './mapper/fwu.mapper';

@ApiTags('fwu')
@JwtAuthentication()
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(
		private readonly fwuLearningContentsUc: FwuLearningContentsUc,
		@Inject(FWU_PUBLIC_API_CONFIG_TOKEN) private readonly fwuPublicApiConfig: FwuPublicApiConfig
	) {}

	@ApiOperation({ summary: 'Streamable download of a content file.' })
	@ApiProduces('application/octet-stream')
	@ApiResponse({
		status: 200,
		schema: { type: 'string', format: 'binary' },
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('*/:fwuLearningContent')
	public async get(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Param() params: GetFwuLearningContentParams
	): Promise<StreamableFile> {
		if (!this.fwuPublicApiConfig.fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const bytesRange = req.header('Range');
		const path = `${req.params[0]}/${params.fwuLearningContent}`;
		const response = await this.fwuLearningContentsUc.get(path, bytesRange);

		if (bytesRange) {
			res.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': response.contentRange,
			});

			res.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			res.status(HttpStatus.OK);
		}

		req.on('close', () => response.data.destroy());

		return new StreamableFile(response.data, {
			type: response.contentType,
			disposition: `inline; filename="${encodeURI(params.fwuLearningContent)}"`,
			length: response.contentLength,
		});
	}

	@ApiOperation({ summary: 'Get a list of content items.' })
	@ApiResponse({ status: 200, description: 'Returns a list of content items.', type: FwuListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get()
	public async getList(): Promise<FwuListResponse> {
		if (!this.fwuPublicApiConfig.fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}

		const list = await this.fwuLearningContentsUc.getList(filesIndex);

		const response = FwuMapper.mapToFwuListResponse(list);

		return response;
	}
}
