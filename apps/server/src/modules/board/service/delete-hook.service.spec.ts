import { Test, TestingModule } from '@nestjs/testing';
import { columnBoardFactory, columnFactory, setupEntities } from '@shared/testing';
import { DeleteHookService } from './delete-hook.service';

describe(DeleteHookService.name, () => {
	let module: TestingModule;
	let service: DeleteHookService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [DeleteHookService],
		}).compile();

		service = module.get(DeleteHookService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when used as a visitor on a board composite', () => {
		describe('acceptAsync', () => {
			it('should make the children accept the service', async () => {
				const columns = columnFactory.buildList(2).map((col) => {
					col.acceptAsync = jest.fn();
					return col;
				});
				const board = columnBoardFactory.build({ children: columns });

				await board.acceptAsync(service);

				expect(columns[0].acceptAsync).toHaveBeenCalledWith(service);
				expect(columns[1].acceptAsync).toHaveBeenCalledWith(service);
			});
		});
	});
});
