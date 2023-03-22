import { Controller, Get, Req, Res, InternalServerErrorException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';

@ApiTags('fwu')
@Authenticate('jwt')
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(private readonly fwuLearningContentsUc: FwuLearningContentsUc) {}

	@Get('*/:fwuLearningContent')
	async get(@Req() req: Request, @Res() res: Response, @Param() params: GetFwuLearningContentParams) {
		const fwuContentEnabled = Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean;
		if (!fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const path = `${req.params[0]}/${params.fwuLearningContent}`;
		const response = await this.fwuLearningContentsUc.get(path);
		const startIndexOfContentType = params.fwuLearningContent.lastIndexOf('.');
		const contentType = params.fwuLearningContent.slice(startIndexOfContentType);

		res.type(contentType);
		res.send(response);
	}
}
