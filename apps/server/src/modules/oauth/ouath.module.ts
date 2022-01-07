import { Module } from "@nestjs/common";
import { OauthController } from "./controller/oauth.controller";
import { LoggerModule } from '@src/core/logger';
import { OauthUc } from "./uc/oauth.uc";



@Module({
	imports: [LoggerModule],
	controllers: [OauthController],
	providers: [OauthUc],
	exports: [OauthUc],
})
export class OauthModule {}