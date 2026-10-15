import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { AuthorizationService } from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CopyElementType, type CopyStatus, CopyStatusEnum } from '../../copy-helper';
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

		describe('when moving a card into a different board context', () => {
			const setupCrossBoardMove = () => {
				const { user } = setup();
				const fromBoard = columnBoardFactory.build();
				const toBoard = columnBoardFactory.build();
				const fromColumn = columnFactory.build({ path: fromBoard.id });
				const toColumn = columnFactory.build({ path: toBoard.id });
				const card = cardFactory.build({ path: `${fromBoard.id},${fromColumn.id}` });

				boardNodeService.findByClassAndId
					.mockResolvedValueOnce(card)
					.mockResolvedValueOnce(fromColumn)
					.mockResolvedValueOnce(toColumn);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const fromBoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				const toBoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				boardNodeAuthorizableService.getBoardAuthorizable
					.mockResolvedValueOnce(fromBoardNodeAuthorizable)
					.mockResolvedValueOnce(toBoardNodeAuthorizable);

				columnBoardService.findById.mockResolvedValueOnce(fromBoard).mockResolvedValueOnce(toBoard);

				return { user, card, toColumn };
			};

			it('should throw forbidden when the target board denies content creation (e.g. an archived room)', async () => {
				const { user, card, toColumn } = setupCrossBoardMove();

				boardNodeRule.can.mockImplementation((operation) => operation !== 'createCard');

				await expect(uc.moveCard(user.id, card.id, toColumn.id)).rejects.toThrow();
				expect(boardNodeService.move).not.toHaveBeenCalled();
			});

			it('should move the card when the target board allows content creation', async () => {
				const { user, card, toColumn } = setupCrossBoardMove();

				boardNodeRule.can.mockReturnValue(true);

				await uc.moveCard(user.id, card.id, toColumn.id);

				expect(boardNodeService.move).toHaveBeenCalledWith(card, toColumn, undefined);
			});
		});
	});
});
