import { Test, TestingModule } from '@nestjs/testing';
import { CardClientModule } from './card-client.module';
import { CardClientAdapter } from './card-client.adapter';

describe('CardClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				CardClientModule.register({
					basePath: 'http://localhost:3030/api/v3',
				}),
			],
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
