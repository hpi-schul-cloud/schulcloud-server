import { Controller, Get, Req, Res, InternalServerErrorException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
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
	async get(@Req() req: Request, @Res() res: Response, @Param() params: GetFwuLearningContentParams) {
		if (!this.configService.get<boolean>('FEATURE_FWU_CONTENT_ENABLED')) {
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
