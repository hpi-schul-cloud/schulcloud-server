import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../copy-helper';
import { BoardNodeFactory } from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService, ColumnBoardService } from '../service';
import { boardNodeAuthorizableFactory, columnBoardFactory, columnFactory } from '../testing';
import { BoardUc } from './board.uc';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../board.config';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: BoardContextApiHelperService,
					useValue: createMock<BoardContextApiHelperService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: BOARD_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: BoardConfig,
					useValue: createMock<BoardConfig>(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		boardNodeService = module.get(BoardNodeService);
		columnBoardService = module.get(ColumnBoardService);
		boardNodeRule = module.get(BoardNodeRule);
		authorizationService = module.get(AuthorizationService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		jest.clearAllMocks();
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();

		return { user, board, boardId, column };
	};

	describe('copyColumnBoard', () => {
		describe('when something goes wrong', () => {
			it('should throw UnprocessableEntityException when Column has no parent', async () => {
				const { user, column } = setup();
				// card.parentId = null;
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await expect(uc.copyColumn(user.id, column.id, 'school-id')).rejects.toThrowError('Column has no parent board');
			});

			it('should throw InternalServerError if copyEntity is not a Column', async () => {
				const { user, board } = setup();
				const column = columnFactory.build({ path: board.id });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				boardNodeRule.can.mockReturnValueOnce(true);

				const boardAuthorizable = boardNodeAuthorizableFactory.build({ boardNode: column });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardAuthorizable);

				const copyStatus: CopyStatus = {
					status: CopyStatusEnum.SUCCESS,
					type: CopyElementType.COLUMN,
					elements: [],
					copyEntity: board, // Intentionally incorrect type to trigger the error
				};
				columnBoardService.copyColumn.mockResolvedValueOnce(copyStatus);

				await expect(uc.copyColumn(user.id, column.id, 'school-id')).rejects.toThrowError(
					'Copied entity is not a column'
				);
			});
		});
	});
});
