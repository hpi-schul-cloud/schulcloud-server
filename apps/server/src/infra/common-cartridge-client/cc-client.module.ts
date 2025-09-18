import { Module, Scope } from '@nestjs/common';
import { CommonCartridgeImportClientAdapter } from './cc-client.adapter';
import { Configuration, ImportCommonCartridgeApi } from './generated';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtExtractor } from '@shared/common/utils';
import { CommonCartridgeImportClientConfig } from './cc-client.config';
import { Request } from 'express';
import { LoggerModule } from '@core/logger';

@Module({
	imports: [LoggerModule],
	providers: [
		CommonCartridgeImportClientAdapter,
		{
			provide: ImportCommonCartridgeApi,
			scope: Scope.REQUEST,
			useFactory: (
				configService: ConfigService<CommonCartridgeImportClientConfig, true>,
				request: Request
			): ImportCommonCartridgeApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new ImportCommonCartridgeApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [CommonCartridgeImportClientAdapter],
})
export class CommonCartridgeImportClientModule {}
