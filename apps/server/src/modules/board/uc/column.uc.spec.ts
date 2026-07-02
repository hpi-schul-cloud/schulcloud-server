import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../copy-helper';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { BoardNodeFactory } from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService, ColumnBoardService } from '../service';
import { boardNodeAuthorizableFactory, cardFactory, columnBoardFactory, columnFactory } from '../testing';
import { ColumnUc } from './column.uc';

describe(ColumnUc.name, () => {
	let module: TestingModule;
	let uc: ColumnUc;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnUc,
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
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
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
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
			],
		}).compile();

		uc = module.get(ColumnUc);
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
		const column = columnFactory.build({ path: board.id });
		const card = cardFactory.build({ path: `${board.id},${column.id}` });

		return { user, board, column, card };
	};

	describe('copyCard', () => {
		describe('when something goes wrong', () => {
			it('should throw error if copyEntity is not a Card', async () => {
				const { user, column, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				boardNodeRule.can.mockReturnValueOnce(true);

				const boardAuthorizable = boardNodeAuthorizableFactory.build({ boardNode: card });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardAuthorizable);

				const copyStatus: CopyStatus = {
					status: CopyStatusEnum.SUCCESS,
					type: CopyElementType.CARD,
					elements: [],
					copyEntity: column, // Intentionally incorrect type to trigger the error
				};
				columnBoardService.copyCard.mockResolvedValueOnce(copyStatus);

				await expect(uc.copyCard(user.id, card.id, 'school-id')).rejects.toThrow('Copied entity is not a card');
			});
		});
	});

	describe('moveCard', () => {
		describe('when something goes wrong', () => {
			it('should throw error if card has no parent', async () => {
				const { user, column, card } = setup();

				const cardWithoutParent = cardFactory.build({ path: '' });

				boardNodeService.findByClassAndId.mockResolvedValueOnce(cardWithoutParent);

				await expect(uc.moveCard(user.id, card.id, column.id)).rejects.toThrow('Card has no parent column');
			});
		});
	});
});
