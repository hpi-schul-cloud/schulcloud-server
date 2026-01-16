import { faker } from '@faker-js/faker/.';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CardClientAdapter, CardClientConfig, CardClientModule } from '.';

describe('CardClientModule', () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				CardClientModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): CardClientConfig => {
							return {
								API_HOST: faker.internet.url(),
							};
						},
					],
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	describe('when resolving dependencies', () => {
		it('should resolve CardClientAdapter', async () => {
			const adapter = await module.resolve(CardClientAdapter);

			expect(adapter).toBeInstanceOf(CardClientAdapter);
		});
	});
});
