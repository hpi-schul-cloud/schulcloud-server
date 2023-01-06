import { Module } from '@nestjs/common';
import { ProvisioningModule } from '../provisioning';
import { SystemModule } from '../system';
import { UserModule } from '../user';
import { UserMigrationModule } from '../user-migration';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

@Module({
	imports: [OauthModule, SystemModule, UserModule, UserMigrationModule, ProvisioningModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
