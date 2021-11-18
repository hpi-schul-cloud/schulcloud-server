import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { ImATeapotException, Scope } from '@nestjs/common';
import { FeathersServiceProvider } from './feathers-service.provider';

describe('FeathersServiceProvider', () => {
	let provider: FeathersServiceProvider;

	describe('When the feathers instance is defined (here mocked)', () => {
		beforeEach(async () => {
			const module: TestingModule = await Test.createTestingModule({
				providers: [
					FeathersServiceProvider,
					{
						provide: REQUEST,
						useValue: {
							app: {
								get: () => {
									return {
										service: () => {
											return {};
										},
									};
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

	describe('When the feathers instance is not defined', () => {
		beforeEach(async () => {
			const module: TestingModule = await Test.createTestingModule({
				providers: [
					FeathersServiceProvider,
					{
						provide: REQUEST,
						useValue: {
							app: {
								get: () => {
									return undefined;
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

		it('should fail when feathers reference is missing', () => {
			expect(() => provider.getService('users')).toThrow(ImATeapotException);
		});
	});
});
