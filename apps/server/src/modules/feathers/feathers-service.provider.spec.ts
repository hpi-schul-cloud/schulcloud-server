import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { Scope } from '@nestjs/common';
import { FeathersServiceProvider } from './feathers-service.provider';

describe('FeathersServiceProvider', () => {
	let provider: FeathersServiceProvider;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FeathersServiceProvider,
				{
					provide: REQUEST,
					useValue: {
						app: {
							service: () => {
								return {};
							},
						},
					},
					scope: Scope.REQUEST,
				},
			],
		}).compile();

		provider = await module.resolve<FeathersServiceProvider>(FeathersServiceProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});

	it('should provide a service', () => {
		const service = provider.getService('users');
		expect(service).toBeDefined();
	});
});
