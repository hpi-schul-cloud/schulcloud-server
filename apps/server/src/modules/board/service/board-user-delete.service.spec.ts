import { Logger } from '@core/logger';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '../../deletion';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardNodeEntity } from '../repo';
import { mediaBoardFactory } from '../testing';
import { BoardNodeService } from './board-node.service';
import { MediaBoardService } from './media-board';
import { BoardUserDeleteService } from './board-user-delete.service';

describe(BoardUserDeleteService.name, () => {
	let module: TestingModule;
	let service: BoardUserDeleteService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;

	beforeAll(async () => {
		await setupEntities([BoardNodeEntity]);

		module = await Test.createTestingModule({
			providers: [
				BoardUserDeleteService,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();

		service = module.get(BoardUserDeleteService);
		boardNodeService = module.get(BoardNodeService);
		mediaBoardService = module.get(MediaBoardService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteUserData', () => {
		describe('when deleting a user', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();
				const userId = new ObjectId().toHexString();

				mediaBoardService.findByExternalReference.mockResolvedValueOnce([board]);

				return {
					board,
					userId,
				};
			};

			it('should delete all user boards', async () => {
				const { board, userId } = setup();

				await service.deleteUserData(userId);

				expect(boardNodeService.delete).toHaveBeenCalledWith(board);
			});

			it('should return a report report', async () => {
				const { board, userId } = setup();

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(
					DomainDeletionReportBuilder.build(DomainName.BOARD, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 1, [board.id]),
					])
				);
			});
		});
	});
});
