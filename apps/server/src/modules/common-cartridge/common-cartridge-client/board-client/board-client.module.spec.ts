import { Test, TestingModule } from '@nestjs/testing';
import { BoardClientModule } from './board-client.module';
import { BoardClientAdapter } from './board-client.adapter';

describe('BoardClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				BoardClientModule.register({
					basePath: 'http://localhost:3030/api/v3',
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the BoardClientAdapter defined', () => {
		const boardClientAdapter = module.get(BoardClientAdapter);
		expect(boardClientAdapter).toBeDefined();
	});
});
