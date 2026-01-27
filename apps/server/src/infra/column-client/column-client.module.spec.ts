import { faker } from '@faker-js/faker/.';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnClientAdapter } from './column-client.adapter';
import { ColumnClientConfig } from './column-client.config';
import { ColumnClientModule } from './column-client.module';

describe('ColumnClientModule', () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ColumnClientModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): ColumnClientConfig => {
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
		it('should resolve ColumnClientAdapter', async () => {
			const adapter = await module.resolve(ColumnClientAdapter);

			expect(adapter).toBeInstanceOf(ColumnClientAdapter);
		});
	});
});
