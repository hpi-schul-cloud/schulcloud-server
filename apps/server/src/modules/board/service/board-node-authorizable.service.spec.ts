import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardNodeAuthorizable, BoardRoles, joinPath, UserWithBoardRoles } from '../domain';
import { BoardNodeRepo } from '../repo';
import { cardFactory, columnBoardFactory, columnFactory } from '../testing';
import { BoardNodeAuthorizableService } from './board-node-authorizable.service';
import { BoardNodeService } from './board-node.service';
import { BoardContextResolverService, PreparedBoardContext } from './internal/board-context';

describe(BoardNodeAuthorizableService.name, () => {
	let module: TestingModule;
	let service: BoardNodeAuthorizableService;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardContextResolverService: DeepMocked<BoardContextResolverService>;

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
					provide: BoardContextResolverService,
					useValue: createMock<BoardContextResolverService>(),
				},
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
			],
		}).compile();

		injectionService = module.get(AuthorizationInjectionService);
		service = module.get(BoardNodeAuthorizableService);
		boardNodeRepo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
		boardContextResolverService = module.get(BoardContextResolverService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.injectReferenceLoader).toHaveBeenCalledWith(AuthorizableReferenceType.BoardNode, service);
		});
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
					boardConfiguration: {},
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
			const boardConfiguration = { canEditorsManageVideoconference: true };
			const preparedContext: PreparedBoardContext = {
				type: columnBoard.context.type,
				getUsersWithBoardRoles: () => usersWithRoles,
				getBoardConfiguration: () => boardConfiguration,
			};
			boardContextResolverService.resolve.mockResolvedValue(preparedContext);

			return { boardConfiguration, columnBoard, column, usersWithRoles };
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
			const { boardConfiguration, column, columnBoard, usersWithRoles } = setup();

			const result = await service.getBoardAuthorizable(column);
			const expected = new BoardNodeAuthorizable({
				users: usersWithRoles,
				id: column.id,
				boardNode: column,
				rootNode: columnBoard,
				parentNode: columnBoard,
				boardConfiguration,
			});

			expect(result).toEqual(expected);
		});
	});

	describe('getBoardAuthorizables', () => {
		describe('when getting authorizables for multiple board nodes', () => {
			const setup = () => {
				const card1 = cardFactory.build();
				const card2 = cardFactory.build();
				const column = columnFactory.build({ children: [card1, card2] });
				const columnBoard = columnBoardFactory.build({ children: [column] });

				const usersWithRoles: UserWithBoardRoles[] = [{ userId: columnBoard.context.id, roles: [BoardRoles.EDITOR] }];
				const boardConfiguration = { canEditorsManageVideoconference: true };
				const preparedContext: PreparedBoardContext = {
					type: columnBoard.context.type,
					getUsersWithBoardRoles: () => usersWithRoles,
					getBoardConfiguration: () => boardConfiguration,
				};
				boardContextResolverService.resolve.mockResolvedValue(preparedContext);
				boardNodeService.findByIds.mockResolvedValue([columnBoard, column]);

				return { columnBoard, column, card1, card2, usersWithRoles, boardConfiguration };
			};

			it('should call boardNodeService.findByIds with root and parent ids', async () => {
				const { card1, card2, columnBoard, column } = setup();

				await service.getBoardAuthorizables([card1, card2]);

				expect(boardNodeService.findByIds).toHaveBeenCalledWith(expect.arrayContaining([columnBoard.id, column.id]), 1);
			});

			it('should return authorizables for all board nodes', async () => {
				const { card1, card2, usersWithRoles, boardConfiguration, columnBoard, column } = setup();

				const result = await service.getBoardAuthorizables([card1, card2]);

				expect(result).toHaveLength(2);
				expect(result[0]).toEqual(
					new BoardNodeAuthorizable({
						users: usersWithRoles,
						id: card1.id,
						boardNode: card1,
						rootNode: columnBoard,
						parentNode: column,
						boardConfiguration,
					})
				);
				expect(result[1]).toEqual(
					new BoardNodeAuthorizable({
						users: usersWithRoles,
						id: card2.id,
						boardNode: card2,
						rootNode: columnBoard,
						parentNode: column,
						boardConfiguration,
					})
				);
			});

			it('should resolve context only once for shared context', async () => {
				const { card1, card2 } = setup();

				await service.getBoardAuthorizables([card1, card2]);

				expect(boardContextResolverService.resolve).toHaveBeenCalledTimes(1);
			});
		});

		describe('when board node parent is not in the loaded map', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build();
				// Create a card with columnBoard as root but column (not loaded) as parent
				const card = cardFactory.build({
					path: joinPath(joinPath(',', columnBoard.id), 'some-column-id'),
				});

				const usersWithRoles: UserWithBoardRoles[] = [{ userId: columnBoard.context.id, roles: [BoardRoles.EDITOR] }];
				const boardConfiguration = {};
				const preparedContext: PreparedBoardContext = {
					type: columnBoard.context.type,
					getUsersWithBoardRoles: () => usersWithRoles,
					getBoardConfiguration: () => boardConfiguration,
				};
				boardContextResolverService.resolve.mockResolvedValue(preparedContext);

				boardNodeService.findByIds.mockResolvedValue([columnBoard]);

				return { columnBoard, card, usersWithRoles, boardConfiguration };
			};

			it('should return authorizable with undefined parentNode', async () => {
				const { card, columnBoard, usersWithRoles, boardConfiguration } = setup();

				const result = await service.getBoardAuthorizables([card]);

				expect(result[0]).toEqual(
					new BoardNodeAuthorizable({
						users: usersWithRoles,
						id: card.id,
						boardNode: card,
						rootNode: columnBoard,
						parentNode: undefined,
						boardConfiguration,
					})
				);
			});
		});

		describe('when board nodes have different contexts', () => {
			const setup = () => {
				const columnBoard1 = columnBoardFactory.build();
				const columnBoard2 = columnBoardFactory.build();
				const card1 = cardFactory.build({ path: joinPath(',', columnBoard1.id) });
				const card2 = cardFactory.build({ path: joinPath(',', columnBoard2.id) });

				boardNodeService.findByIds.mockResolvedValue([columnBoard1, columnBoard2]);

				return { card1, card2 };
			};

			it('should throw an error', async () => {
				const { card1, card2 } = setup();

				await expect(service.getBoardAuthorizables([card1, card2])).rejects.toThrow(
					'Multiple contexts found for board nodes. All board nodes must share the same context to load authorizables.'
				);
			});
		});
	});
});
