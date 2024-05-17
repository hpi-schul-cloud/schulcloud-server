import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '../testing';
import { BoardNodeAuthorizable, BoardRoles, UserWithBoardRoles } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardContextService } from './board-context.service';
import { BoardNodeAuthorizableService } from './board-node-authorizable.service';
import { BoardNodeService } from './board-node.service';

describe(BoardNodeAuthorizableService.name, () => {
	let module: TestingModule;
	let service: BoardNodeAuthorizableService;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardContextService: DeepMocked<BoardContextService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeAuthorizableService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardContextService,
					useValue: createMock<BoardContextService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeAuthorizableService);
		boardNodeRepo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
		boardContextService = module.get(BoardContextService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when finding a board domainobject', () => {
			const setup = () => {
				const column = columnFactory.build();
				const columnBoard = columnBoardFactory.build({ children: [column] });
				boardNodeRepo.findById.mockResolvedValueOnce(column);

				const authorizable: BoardNodeAuthorizable = new BoardNodeAuthorizable({
					id: column.id,
					boardNode: column,
					rootNode: columnBoard,
					users: [],
				});

				return { columnBoard, column, authorizable };
			};

			it('should call the repository', async () => {
				const { column } = setup();

				await service.findById(column.id);

				expect(boardNodeRepo.findById).toHaveBeenCalledWith(column.id, 1);
			});

			it('should return the result from getBoardAuthorizable', async () => {
				const { column, authorizable } = setup();
				const spy = jest.spyOn(service, 'getBoardAuthorizable').mockResolvedValueOnce(authorizable);

				const result = await service.findById(column.id);

				expect(result).toEqual(authorizable);

				spy.mockRestore();
			});
		});
	});

	describe('getBoardAuthorizable', () => {
		const setup = () => {
			const column = columnFactory.build();
			const columnBoard = columnBoardFactory.build({ children: [column] });

			boardNodeService.findParent.mockResolvedValueOnce(columnBoard);
			boardNodeService.findRoot.mockResolvedValueOnce(columnBoard);
			const usersWithRoles: UserWithBoardRoles[] = [
				{
					userId: columnBoard.context.id,
					roles: [BoardRoles.EDITOR],
				},
			];
			boardContextService.getUsersWithBoardRoles.mockResolvedValue(usersWithRoles);

			return { columnBoard, column, usersWithRoles };
		};

		it('should call the service to get the parent node', async () => {
			const { column } = setup();

			await service.getBoardAuthorizable(column);

			expect(boardNodeService.findParent).toHaveBeenCalledWith(column, 1);
		});

		it('should call the service to get the root node', async () => {
			const { column } = setup();

			await service.getBoardAuthorizable(column);

			expect(boardNodeService.findRoot).toHaveBeenCalledWith(column, 1);
		});

		it('should return an authorizable of the root context', async () => {
			const { column, columnBoard, usersWithRoles } = setup();

			const result = await service.getBoardAuthorizable(column);
			const expected = new BoardNodeAuthorizable({
				users: usersWithRoles,
				id: column.id,
				boardNode: column,
				rootNode: columnBoard,
				parentNode: columnBoard,
			});

			expect(result).toEqual(expected);
		});
	});
});
