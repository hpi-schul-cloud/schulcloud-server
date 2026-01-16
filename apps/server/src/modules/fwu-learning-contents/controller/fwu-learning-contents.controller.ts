import { Configuration } from '@hpi-schul-cloud/commons/lib';
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
	UseInterceptors,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';
import { fwuIndex } from '../interface/fwuIndex.type';

@ApiTags('fwu')
@JwtAuthentication()
@Controller('fwu')
export class FwuLearningContentsController {
	private readonly ttl = 86400 * 30;

	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private readonly fwuLearningContentsUc: FwuLearningContentsUc
	) {}

	@Get('*/:fwuLearningContent')
	public async get(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Param() params: GetFwuLearningContentParams
	): Promise<StreamableFile> {
		if (!Configuration.get('FEATURE_FWU_CONTENT_ENABLED')) {
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

	@Get()
	@UseInterceptors(CacheInterceptor)
	public async getList(): Promise<fwuIndex[]> {
		if (!Configuration.get('FEATURE_FWU_CONTENT_ENABLED')) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}

		const cached = await this.cacheManager.get('fwuList');
		if (cached && Array.isArray(cached) && cached.length > 0) {
			return cached as fwuIndex[];
		}

		const list = await this.fwuLearningContentsUc.getList();
		await this.cacheManager.set('fwuList', list, this.ttl);

		return list;
	}
}
