import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { BoardsClientAdapter } from './adapter/boards-client.adapter';
import { InternalCommonCartridgeClientsConfig } from './common-cartridge-clients.config';
import { CommonCartridgeClientsModule } from './common-cartridge-clients.module';

@Configuration()
class TestInternalCommonCartridgeClientsConfig implements InternalCommonCartridgeClientsConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/boards';
}

describe(CommonCartridgeClientsModule.name, () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [CommonCartridgeClientsModule.register('CC_CLIENT_CONFIG', TestInternalCommonCartridgeClientsConfig)],
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
		it('should resolve BoardsClientAdapter', async () => {
			const adapter = await module.resolve(BoardsClientAdapter);

			expect(adapter).toBeInstanceOf(BoardsClientAdapter);
		});
	});
});
