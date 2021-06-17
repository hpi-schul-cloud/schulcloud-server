import { Controller, Get, NestInterceptor } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

@Controller()
class DelayController {
	/** default route to test public access */
	@Get()
	async getHello(): Promise<string> {
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
