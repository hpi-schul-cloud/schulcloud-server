import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoard } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { ColumnBoardService } from '@src/modules/board';
import { CourseService } from '@src/modules/learnroom';
import { BoardUrlHandler } from './board-url-handler';

describe(BoardUrlHandler.name, () => {
	let module: TestingModule;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardUrlHandler: BoardUrlHandler;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUrlHandler,
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		columnBoardService = module.get(ColumnBoardService);
		boardUrlHandler = module.get(BoardUrlHandler);
		await setupEntities();
	});

	describe('getMetaData', () => {
		it('should call courseService with the correct id', async () => {
			const id = 'af322312feae';
			const url = `htttps://localhost/rooms/${id}/board`;

			await boardUrlHandler.getMetaData(url);

			expect(columnBoardService.findById).toHaveBeenCalledWith(id);
		});

		it('should take the title from the board name', async () => {
			const id = 'af322312feae';
			const url = `htttps://localhost/rooms/${id}/board`;
			const boardName = 'My Board';
			columnBoardService.findById.mockResolvedValue({
				title: boardName,
				context: { type: 'course', id: 'a-board-id' },
			} as ColumnBoard);

			const result = await boardUrlHandler.getMetaData(url);

			expect(result).toEqual(expect.objectContaining({ title: boardName, type: 'board' }));
		});
	});
});
