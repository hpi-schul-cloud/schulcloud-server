import { Logger } from '@core/logger';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { UserDeletionInjectionService } from '../../deletion';
import { BoardNodeEntity } from '../repo';
import { BoardNodeService, MediaBoardService } from '../service';
import { mediaBoardFactory } from '../testing';
import { DeleteUserBoardDataStep } from './delete-user-board-data.step';

describe(DeleteUserBoardDataStep.name, () => {
	let module: TestingModule;
	let service: DeleteUserBoardDataStep;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;

	beforeAll(async () => {
		await setupEntities([BoardNodeEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserBoardDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
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

		service = module.get(DeleteUserBoardDataStep);
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

				await service.execute({ userId });

				expect(boardNodeService.delete).toHaveBeenCalledWith(board);
			});

			it('should return a report report', async () => {
				const { board, userId } = setup();

				const result = await service.execute({ userId });

				expect(result).toEqual(
					StepReportBuilder.build(ModuleName.BOARD, [
						StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [board.id]),
					])
				);
			});
		});
	});
});
