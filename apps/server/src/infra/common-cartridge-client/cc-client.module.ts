import { Module, Scope } from '@nestjs/common';
import { CommonCartrideImportClientAdapter } from './cc-client.adapter';
import { Configuration, ImportCommonCartridgeApi } from './generated';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtExtractor } from '@shared/common/utils';
import { CommonCartridgeImportClientConfig } from './cc-client.config';
import { Request } from 'express';

@Module({
	providers: [
		CommonCartrideImportClientAdapter,
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
	exports: [CommonCartrideImportClientAdapter],
})
export class CommonCartridgeImportClientModule {}
