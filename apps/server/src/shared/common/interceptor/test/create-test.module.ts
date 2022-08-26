import { Controller, Get, NestInterceptor } from '@nestjs/common';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestTimeout } from '@shared/common/decorators';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Controller()
class DelayController {
	/** default route to test public access */
	@Get()
	async getHello(): Promise<string> {
		await delay(100);
		return 'Schulcloud Server API';
	}

	@RequestTimeout(1)
	@Get('/timeout')
	async getHelloWithTimeout(): Promise<string> {
		await delay(100);
		return 'Schulcloud Server API';
	}
}

export const createTestModule = (interceptor: NestInterceptor): Promise<TestingModule> => {
	return Test.createTestingModule({
		providers: [
			{
				provide: APP_INTERCEPTOR,
				useValue: interceptor,
			},
		],
		controllers: [DelayController],
	}).compile();
};
