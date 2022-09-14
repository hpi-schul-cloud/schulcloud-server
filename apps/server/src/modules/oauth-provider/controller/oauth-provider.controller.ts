import { Controller, Get, Param } from '@nestjs/common';
import { IdParams } from '@src/modules/oauth-provider/controller/dto/id.params';

@Controller('oauth2')
export class OauthProviderController {
	@Get('clients/:id')
	getClients(@Param() idParams: IdParams) {}
}
