import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';
import { SystemUc } from '../uc/system.uc';

@ApiTags('System')
@Controller('system')
export class SystemController {
	constructor(private readonly systemUc: SystemUc) {}

	@Get('oauth')
	async findOauthConfigs(): Promise<OauthResponse> {
		return this.systemUc.findOauthConfigs();
	}
}
