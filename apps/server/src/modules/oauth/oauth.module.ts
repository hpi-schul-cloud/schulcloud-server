import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserModule } from '@src/modules/user';
import { HydraSsoService } from './service/hydra.service';
import { OAuthService } from './service/oauth.service';

@Module({
	imports: [LoggerModule, AuthorizationModule, HttpModule, EncryptionModule, UserModule],
	providers: [OAuthService, HydraSsoService, LtiToolRepo],
	exports: [OAuthService, HydraSsoService],
})
export class OauthModule {}
