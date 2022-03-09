import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { UserRepo } from '@shared/repo';
import { SystemRepo } from '@shared/repo/system';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthUc } from './uc/oauth.uc';

const key = Configuration.get('AES_KEY') as string;

@Module({
	imports: [LoggerModule, AuthorizationModule, HttpModule],
	controllers: [OauthSSOController],
	providers: [
		OauthUc,
		SystemRepo,
		UserRepo,
		{ provide: 'SYMMETRIC_CIPHER_KEY', useValue: key },
		{ provide: 'OAuthEncryptionService', useClass: SymetricKeyEncryptionService },
	],
	exports: [OauthUc],
})
export class OauthModule {}
