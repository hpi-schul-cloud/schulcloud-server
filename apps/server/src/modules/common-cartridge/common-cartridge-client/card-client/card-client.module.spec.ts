import { Test, TestingModule } from '@nestjs/testing';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from '../../api-client.config';
import { CardClientAdapter } from './card-client.adapter';
import { CardClientModule } from './card-client.module';

describe('CardClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [CardClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig)],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when module is initialized', () => {
		it('should have the CardClientAdapter defined', () => {
			const cardClientAdapter = module.get(CardClientAdapter);
			expect(cardClientAdapter).toBeDefined();
		});
	});
});
