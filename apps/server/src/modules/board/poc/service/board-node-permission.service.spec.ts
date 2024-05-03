import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { columnBoardFactory, setupEntities, userFactory } from '@shared/testing';
import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { BoardDoAuthorizable, BoardRoles, UserWithBoardRoles } from '@shared/domain/domainobject';
import { BoardNodePermissionService } from './board-node-permission.service';
import { BoardDoAuthorizableService } from '../../service';

describe(BoardNodePermissionService.name, () => {
	let module: TestingModule;
	let service: BoardNodePermissionService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodePermissionService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodePermissionService);
		authorizationService = module.get(AuthorizationService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);

		await setupEntities();
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

			const boardAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.READER] }],
				id: anyBoardDo.id,
				boardDo: anyBoardDo,
				rootDo: columnBoardFactory.build(),
			});

			return { anyBoardDo, boardAuthorizable, user };
		};

		it('should call authorization service to getUserWithPermission', async () => {
			const { anyBoardDo, user } = setup();
			await service.checkPermission(user.id, anyBoardDo, Action.write);

			expect(authorizationService.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should call boardDoAuthorizableService to getBoardAuthorizable', async () => {
			const { anyBoardDo, user } = setup();
			await service.checkPermission(user.id, anyBoardDo, Action.write);

			expect(boardDoAuthorizableService.getBoardAuthorizable).toBeCalledWith(anyBoardDo);
		});

		it('should call authorization service to checkPermission', async () => {
			const { anyBoardDo, boardAuthorizable, user } = setup();
			authorizationService.getUserWithPermissions.mockResolvedValue(user);

			boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardAuthorizable);

			await service.checkPermission(user.id, anyBoardDo, Action.write);

			const permissionContext: AuthorizationContext = {
				action: Action.write,
				requiredPermissions: [],
			};

			expect(authorizationService.checkPermission).toBeCalledWith(user, boardAuthorizable, permissionContext);
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
			const boardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: anyBoardDo.id,
				boardDo: anyBoardDo,
				rootDo: anyBoardDo,
			});
			const result = service.isUserBoardEditor(user.id, boardDoAuthorizable.users);
			expect(result).toBe(true);
		});

		it('should return false if user is not board editor', () => {
			const { anyBoardDo, user } = setup();
			const boardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.READER] }],
				id: anyBoardDo.id,
				boardDo: anyBoardDo,
				rootDo: anyBoardDo,
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
