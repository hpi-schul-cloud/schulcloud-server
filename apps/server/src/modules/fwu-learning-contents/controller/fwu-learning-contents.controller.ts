import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	Get,
	HttpStatus,
	InternalServerErrorException,
	Param,
	Req,
	Res,
	StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';

@ApiTags('fwu')
@JwtAuthentication()
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(private readonly fwuLearningContentsUc: FwuLearningContentsUc) {}

	@Get('*/:fwuLearningContent')
	async get(
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
}
