import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { UserRepo } from '@shared/repo/user';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OauthProviderController } from './controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from './mapper/oauth-provider-response.mapper';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';

@Module({
	imports: [OauthProviderServiceModule, AuthorizationModule],
	providers: [OauthProviderClientCrudUc, OauthProviderResponseMapper, UserRepo],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
