import { Logger } from '@core/logger';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletedEvent,
} from '@modules/deletion';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardNodeEntity } from '../../repo';
import { mediaBoardFactory } from '../../testing';
import { BoardNodeService } from '../board-node.service';
import { MediaBoardService } from '../media-board';
import { BoardUserDeleteService } from './board-user-delete.service';

describe(BoardUserDeleteService.name, () => {
	let module: TestingModule;
	let service: BoardUserDeleteService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
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
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([BoardNodeEntity]),
				},
			],
		}).compile();

		service = module.get(BoardUserDeleteService);
		boardNodeService = module.get(BoardNodeService);
		mediaBoardService = module.get(MediaBoardService);
		eventBus = module.get(EventBus);
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

	describe('handle', () => {
		describe('when deleting a user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const deletionRequestId = new ObjectId().toHexString();
				const report = DomainDeletionReportBuilder.build(DomainName.CLASS, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
				]);

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(report);

				return {
					userId,
					deletionRequestId,
					report,
				};
			};

			it('should return a report report', async () => {
				const { userId, deletionRequestId, report } = setup();

				await service.handle(new UserDeletedEvent(deletionRequestId, userId));

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, report));
			});
		});
	});
});
