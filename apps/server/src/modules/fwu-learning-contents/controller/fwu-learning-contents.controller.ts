import {
	Controller,
	Get,
	Req,
	Res,
	InternalServerErrorException,
	Param,
	StreamableFile,
	HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';

@ApiTags('fwu')
@Authenticate('jwt')
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(
		private readonly fwuLearningContentsUc: FwuLearningContentsUc,
		private readonly configService: ConfigService
	) {}

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
