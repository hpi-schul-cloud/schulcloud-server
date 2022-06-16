import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';
import { SystemUc } from '../uc/system.uc';

@ApiTags('System')
@Controller('system')
export class SystemController {
	constructor(private readonly systemUc: SystemUc) {}

	@Get()
	async find(@Query('type') type: string, @Query('onlyOauth') onlyOauth: false): Promise<SystemOauthResponse> {
		return this.systemUc.findByFilter(type, onlyOauth);
	}
}
