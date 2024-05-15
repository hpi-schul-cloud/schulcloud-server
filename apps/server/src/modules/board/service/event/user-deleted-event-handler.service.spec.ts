import { createMock, type DeepMocked } from '@golevelup/ts-jest';
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
import { Logger } from '@src/core/logger';
import { mediaBoardFactory } from '@shared/testing/factory/domainobject/board';
import { BoardNodeService } from '../board-node.service';
import { MediaBoardService } from '../media-board';
import { UserDeletedEventHandlerService } from './user-deleted-event-handler.service';

describe(UserDeletedEventHandlerService.name, () => {
	let module: TestingModule;
	let service: UserDeletedEventHandlerService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserDeletedEventHandlerService,
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
			],
		}).compile();

		service = module.get(UserDeletedEventHandlerService);
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

				expect(boardNodeService.delete).toHaveBeenCalledWith([board]);
			});

			it('should return a report report', async () => {
				const { board, userId } = setup();

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(
					DomainDeletionReportBuilder.build(DomainName.CLASS, [
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
