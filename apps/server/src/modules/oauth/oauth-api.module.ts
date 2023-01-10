import { Module } from '@nestjs/common';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { UserMigrationModule } from '@src/modules/user-migration';
import { LoggerModule } from '../../core/logger';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

@Module({
	imports: [OauthModule, SystemModule, UserModule, UserMigrationModule, ProvisioningModule, LoggerModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
