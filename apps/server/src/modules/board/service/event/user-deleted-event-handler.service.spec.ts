import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { mediaBoardFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletedEvent,
} from '../../../deletion';
import { MediaBoardService } from '../media-board';
import { UserDeletedEventHandlerService } from './user-deleted-event-handler.service';

describe(UserDeletedEventHandlerService.name, () => {
	let module: TestingModule;
	let service: UserDeletedEventHandlerService;

	let mediaBoardService: DeepMocked<MediaBoardService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserDeletedEventHandlerService,
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

				mediaBoardService.findIdsByExternalReference.mockResolvedValueOnce([board.id]);
				mediaBoardService.deleteByExternalReference.mockResolvedValueOnce(1);

				return {
					board,
					userId,
				};
			};

			it('should delete all user boards', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(mediaBoardService.deleteByExternalReference).toHaveBeenCalledWith({
					type: BoardExternalReferenceType.User,
					id: userId,
				});
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
