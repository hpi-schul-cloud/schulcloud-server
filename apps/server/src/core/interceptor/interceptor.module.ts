import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor } from '@shared/common';

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
			useClass: TimeoutInterceptor,
		},
	],
})
export class InterceptorModule {}
