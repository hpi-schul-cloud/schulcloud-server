import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { CardClientAdapter } from './card-client.adapter';
import { InternalCardClientConfig } from './card-client.config';
import { CardClientModule } from './card-client.module';

@Configuration()
class TestConfig implements InternalCardClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/cards';
}

describe('CardClientModule', () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [CardClientModule.register('CARD_CLIENT_CONFIG', TestConfig)],
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
