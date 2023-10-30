import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { IInterceptorConfig } from '@shared/common/interceptor/interfaces/interceptor-config';
import { TimeoutInterceptor } from '@shared/common/interceptor/timeout.interceptor';

/** *********************************************
 * Global Interceptor setup
 * **********************************************
 * Here, we globally apply
 * - validate input data using @ClassSerializerInterceptor
 * - set a timeout for requests using @TimeoutInterceptor
 */
@Module({
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: ClassSerializerInterceptor,
		},
		{
			provide: APP_INTERCEPTOR, // TODO remove (for testing)
			useFactory: (configService: ConfigService<IInterceptorConfig, true>) => {
				const timeout = configService.get<number>('INCOMING_REQUEST_TIMEOUT');
				return new TimeoutInterceptor(timeout);
			},
			inject: [ConfigService],
		},
	],
})
export class InterceptorModule {}
