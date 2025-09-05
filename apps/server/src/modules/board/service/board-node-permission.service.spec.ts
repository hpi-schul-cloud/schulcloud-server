import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	Action,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardNodeAuthorizable, BoardRoles, UserWithBoardRoles } from '../domain';
import { columnBoardFactory } from '../testing';
import { BoardNodeAuthorizableService } from './board-node-authorizable.service';
import { BoardNodePermissionService } from './board-node-permission.service';

describe(BoardNodePermissionService.name, () => {
	let module: TestingModule;
	let service: BoardNodePermissionService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodePermissionService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodePermissionService);
		authorizationService = module.get(AuthorizationService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);

		await setupEntities([User]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('checkPermission', () => {
		const setup = () => {
			const user = userFactory.build();
			const anyBoardDo = columnBoardFactory.build();

			const boardNodeAuthorizable = new BoardNodeAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.READER] }],
				id: anyBoardDo.id,
				boardNode: anyBoardDo,
				rootNode: columnBoardFactory.build(),
				boardSettings: {},
			});

			return { anyBoardDo, boardNodeAuthorizable, user };
		};

		it('should call authorization service to getUserWithPermission', async () => {
			const { anyBoardDo, user } = setup();
			await service.checkPermission(user.id, anyBoardDo, AuthorizationContextBuilder.write([]));

			expect(authorizationService.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should call boardNodeAuthorizableService to getBoardAuthorizable', async () => {
			const { anyBoardDo, user } = setup();
			await service.checkPermission(user.id, anyBoardDo, AuthorizationContextBuilder.write([]));

			expect(boardNodeAuthorizableService.getBoardAuthorizable).toBeCalledWith(anyBoardDo);
		});

		it('should call authorization service to checkPermission', async () => {
			const { anyBoardDo, boardNodeAuthorizable, user } = setup();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardNodeAuthorizable);

			const permissionContext: AuthorizationContext = {
				action: Action.write,
				requiredPermissions: [],
			};
			await service.checkPermission(user.id, anyBoardDo, permissionContext);

			expect(authorizationService.checkPermission).toBeCalledWith(user, boardNodeAuthorizable, permissionContext);
		});
	});

	describe('isUserBoardEditor', () => {
		const setup = () => {
			const user = userFactory.build();
			const anyBoardDo = columnBoardFactory.build();
			return { anyBoardDo, user };
		};
		it('should return true if user is board editor', () => {
			const { anyBoardDo, user } = setup();
			const boardDoAuthorizable = new BoardNodeAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: anyBoardDo.id,
				boardNode: anyBoardDo,
				rootNode: anyBoardDo,
				boardSettings: {},
			});
			const result = service.isUserBoardEditor(user.id, boardDoAuthorizable.users);
			expect(result).toBe(true);
		});

		it('should return false if user is not board editor', () => {
			const { anyBoardDo, user } = setup();
			const boardDoAuthorizable = new BoardNodeAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.READER] }],
				id: anyBoardDo.id,
				boardNode: anyBoardDo,
				rootNode: anyBoardDo,
				boardSettings: {},
			});
			const result = service.isUserBoardEditor(user.id, boardDoAuthorizable.users);
			expect(result).toBe(false);
		});

		it('should return false if user is not part of board', () => {
			const { anyBoardDo, user } = setup();
			const boardDoAuthorizable = new BoardNodeAuthorizable({
				users: [],
				id: anyBoardDo.id,
				boardNode: anyBoardDo,
				rootNode: anyBoardDo,
				boardSettings: {},
			});
			const result = service.isUserBoardEditor(user.id, boardDoAuthorizable.users);
			expect(result).toBe(false);
		});
	});

	describe('isUserBoardReader', () => {
		const setup = () => {
			const user = userFactory.build();
			return { user };
		};

		it('should return false if user is board editor', () => {
			const { user } = setup();
			const users: UserWithBoardRoles[] = [{ userId: user.id, roles: [BoardRoles.EDITOR] }];
			const result = service.isUserBoardReader(user.id, users);
			expect(result).toBe(false);
		});

		it('should return false if user is both bord editor and reader', () => {
			const { user } = setup();

			const users: UserWithBoardRoles[] = [{ userId: user.id, roles: [BoardRoles.EDITOR, BoardRoles.READER] }];

			const result = service.isUserBoardReader(user.id, users);
			expect(result).toBe(false);
		});

		it('should return true if user is board reader', () => {
			const { user } = setup();

			const users: UserWithBoardRoles[] = [{ userId: user.id, roles: [BoardRoles.READER] }];

			const result = service.isUserBoardReader(user.id, users);
			expect(result).toBe(true);
		});
	});
});
