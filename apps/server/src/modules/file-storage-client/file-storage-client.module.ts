import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { FileStorageClientService } from './uc';
import { FileStorageClientRepo } from './repo';

// https://docs.nestjs.com/techniques/http-module
/*
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});

HttpModule.registerAsync({
  useClass: HttpConfigService,
});
*/
@Module({
	imports: [HttpModule.register({ timeout: 600000 })], // todo: add config
	controllers: [],
	providers: [FileStorageClientService, Logger, FileStorageClientRepo],
	exports: [FileStorageClientService],
})
export class FileStorageClientModule {}
