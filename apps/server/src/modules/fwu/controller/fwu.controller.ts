import { Controller, Get, Req, Res, InternalServerErrorException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Request, Response } from 'express';
import { fwuContentEnabled } from '../fwu.config';
import { FwuUc } from '../uc/fwu.uc';

@ApiTags('FWU')
@Authenticate('jwt')
@Controller('fwu')
export class FwuController {
	constructor(private readonly fwuUc: FwuUc) {}

	@Get('*')
	async get(@Req() req: Request, @Res() res: Response) {
		if (!fwuContentEnabled) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const path = req.params[0];
		let file: Uint8Array;

		try {
			file = await this.fwuUc.get(path);
		} catch (error) {
			throw new Error(`HttpStatusCode: ${error.$metadata.httpStatusCode} at ${path} ${error}`);
		}
		const i = path.lastIndexOf('.');
		const contentType = i !== -1 ? path.slice(i) : 'application/octet-stream';
		res.type(contentType);
		res.send(file);
	}
}
