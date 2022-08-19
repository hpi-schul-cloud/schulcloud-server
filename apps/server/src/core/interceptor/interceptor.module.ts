import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { IInterceptorConfig, TimeoutInterceptor } from '@shared/common';
import { ConfigService } from '@nestjs/config';

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
