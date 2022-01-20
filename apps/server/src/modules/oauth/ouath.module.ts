import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { SystemRepo } from '@shared/repo/system';
import { LoggerModule } from '@src/core/logger';
import { OauthController } from './controller/oauth.controller';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [LoggerModule],
	controllers: [OauthController],
	providers: [OauthUc, SystemRepo, UserRepo],
	exports: [OauthUc],
})
export class OauthModule {}
