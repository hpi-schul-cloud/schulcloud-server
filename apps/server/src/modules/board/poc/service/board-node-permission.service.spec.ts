import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { BoardNodePermissionService } from './board-node-permission.service';
import { AuthorizationService } from '../../../authorization';
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

	describe('checkPermission', () => {});

	describe('isUserBoardEditor', () => {});

	describe('isUserBoardReader', () => {});
});
