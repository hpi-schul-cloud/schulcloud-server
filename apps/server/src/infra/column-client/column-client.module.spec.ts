import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { ColumnClientAdapter } from './column-client.adapter';
import { InternalColumnClientConfig } from './column-client.config';
import { ColumnClientModule } from './column-client.module';

@Configuration()
class TestConfig implements InternalColumnClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/columns';
}

describe('ColumnClientModule', () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [ColumnClientModule.register('COLUMN_CLIENT_CONFIG', TestConfig)],
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
