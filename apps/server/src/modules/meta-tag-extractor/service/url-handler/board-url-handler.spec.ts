import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ColumnBoardService, ColumnBoard } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { Test, TestingModule } from '@nestjs/testing';

import { setupEntities } from '@shared/testing';
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
		describe('when url fits', () => {
			it('should call courseService with the correct id', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/boards/${id}`);

				await boardUrlHandler.getMetaData(url);

				expect(columnBoardService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the board name', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/boards/${id}`);
				const boardName = 'My Board';
				columnBoardService.findById.mockResolvedValue({
					title: boardName,
					context: { type: 'course', id: 'a-board-id' },
				} as ColumnBoard);

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: boardName, type: 'board' }));
			});
		});

		describe('when path in url does not fit', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/671a5bdf0995ace8cbc6f899`);

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});

		describe('when mongoId in url is invalid', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/ef2345abe4e3b`);

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
