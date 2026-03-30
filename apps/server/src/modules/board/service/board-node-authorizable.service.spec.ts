import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardNodeAuthorizable, BoardRoles, UserWithBoardRoles } from '../domain';
import { BoardNodeRepo } from '../repo';
import { columnBoardFactory, columnFactory } from '../testing';
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

		await setupEntities([User]);
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
});
