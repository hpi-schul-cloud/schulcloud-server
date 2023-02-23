import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { MigrationModule } from '@src/modules/migration';
import { SchoolModule } from '@src/modules/school';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

@Module({
	imports: [OauthModule, SystemModule, UserModule, SchoolModule, MigrationModule, ProvisioningModule, LoggerModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
