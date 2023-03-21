import { Controller, Get, Req, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';

@ApiTags('fwu')
@Authenticate('jwt')
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(private readonly fwuLearningContentsUc: FwuLearningContentsUc) {}

	@Get('*')
	async get(@Req() req: Request): Promise<StreamableFile> {
		const fwuContentEnabled = Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean;
		if (!fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const path = req.params[0];
		const response = await this.fwuLearningContentsUc.get(path);
		req.on('close', () => response.data.destroy());
		const startIndexOfContentType = path.lastIndexOf('.');
		const contentType =
			startIndexOfContentType !== -1 ? path.slice(startIndexOfContentType) : 'application/octet-stream';
		const startIndexOfFileName = path.lastIndexOf('/') + 1;
		const fileName = path.slice(startIndexOfFileName);
		return new StreamableFile(response.data, {
			type: contentType,
			disposition: `filename="${fileName}"`,
			length: response.contentLength,
		});
	}
}
