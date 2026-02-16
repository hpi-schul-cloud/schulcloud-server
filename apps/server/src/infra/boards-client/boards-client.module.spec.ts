import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { BoardsClientAdapter } from './boards-client.adapter';
import { InternalBoardsClientConfig } from './boards-client.config';
import { BoardsClientModule } from './boards-client.module';

@Configuration()
class TestInternalBoardsClientConfig implements InternalBoardsClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/boards';
}

describe(BoardsClientModule.name, () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [BoardsClientModule.register('BOARDS_CLIENT_CONFIG', TestInternalBoardsClientConfig)],
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
