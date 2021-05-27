import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

/** *********************************************
 * Global Interceptor setup
 * **********************************************
 * Validation of DTOs will base on type-checking
 * which is enabled by default. To you might use
 * the class-validator decorators to extend
 * validation.
 */
@Module({
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: ClassSerializerInterceptor,
		},
	],
})
export class InterceptorModule {}
