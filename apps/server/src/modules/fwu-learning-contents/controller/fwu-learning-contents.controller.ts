import { Controller, Get, Req, Res, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';

@ApiTags('fwu')
@Authenticate('jwt')
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(private readonly fwuLearningContentsUc: FwuLearningContentsUc) {}

	@Get('*')
	async get(@Req() req: Request, @Res() res: Response) {
		const fwuContentEnabled = Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean;
		if (!fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const path = req.params[0];
		const response = await this.fwuLearningContentsUc.get(path);
		const startIndexOfContentType = path.lastIndexOf('.');
		const contentType =
			startIndexOfContentType !== -1 ? path.slice(startIndexOfContentType) : 'application/octet-stream';

		res.type(contentType);
		res.send(response);
	}
}
