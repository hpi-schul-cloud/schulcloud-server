import { Test, TestingModule } from '@nestjs/testing';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@core/logger';
import { SagaService } from '@modules/saga';
import { RoomService } from '@modules/room';
import { ColumnBoardService } from '../service';
import { CopyRoomBoardsStep } from './copy-room-boards.step';
import { CopyElementType, CopyHelperService, CopyStatusEnum, CopyStatus } from '@modules/copy-helper';
import { columnBoardFactory } from '../testing';
import { roomFactory } from '@modules/room/testing';
import { BoardExternalReferenceType } from '../domain';

describe('CopyRoomBoardsStep', () => {
	let module: TestingModule;
	let step: CopyRoomBoardsStep;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let roomService: DeepMocked<RoomService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CopyRoomBoardsStep,
				{ provide: SagaService, useValue: createMock<SagaService>() },
				{ provide: RoomService, useValue: createMock<RoomService>() },
				{ provide: ColumnBoardService, useValue: createMock<ColumnBoardService>() },
				{ provide: CopyHelperService, useValue: createMock<CopyHelperService>() },
				{ provide: Logger, useValue: createMock<Logger>() },
			],
		}).compile();

		step = module.get(CopyRoomBoardsStep);
		columnBoardService = module.get(ColumnBoardService);
		copyHelperService = module.get(CopyHelperService);
		roomService = module.get(RoomService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('execute', () => {
		describe('when copy status does not contain a copy entity', () => {
			const setup = () => {
				const userId = 'user-id';
				const sourceRoomId = 'source-room-id';
				const targetRoomId = 'target-room-id';

				const board = columnBoardFactory.build();

				columnBoardService.findByExternalReference.mockResolvedValueOnce([board]);

				const room = roomFactory.build();

				roomService.getSingleRoom.mockResolvedValueOnce(room);

				columnBoardService.copyColumnBoard.mockResolvedValueOnce({
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
				});

				return { userId, sourceRoomId, targetRoomId };
			};

			it('should throw an error ', async () => {
				const { userId, sourceRoomId, targetRoomId } = setup();

				await expect(step.execute({ userId, sourceRoomId, targetRoomId })).rejects.toThrow(
					'Copy status does not contain a copy entity'
				);
			});
		});

		describe('when copy status contains a copy entity', () => {
			const setup = () => {
				const userId = 'user-id';

				const board = columnBoardFactory.build();
				columnBoardService.findByExternalReference.mockResolvedValueOnce([board]);

				const sourceRoom = roomFactory.build();
				const targetRoom = roomFactory.build();
				roomService.getSingleRoom.mockResolvedValueOnce(sourceRoom).mockResolvedValueOnce(targetRoom);

				const boardCopy = columnBoardFactory.build({
					title: 'Copied Board',
					context: {
						type: BoardExternalReferenceType.Room,
						id: targetRoom.id,
					},
				});
				const copyStatus: CopyStatus = {
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: boardCopy,
				};
				columnBoardService.copyColumnBoard.mockResolvedValueOnce(copyStatus);

				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

				return { userId, sourceRoom, targetRoom, copyStatus };
			};

			it('should call columnBoardService.swapLinkedIds', async () => {
				const { userId, sourceRoom, targetRoom, copyStatus } = setup();

				await step.execute({ userId, sourceRoomId: sourceRoom.id, targetRoomId: targetRoom.id });

				expect(columnBoardService.swapLinkedIdsInBoards).toHaveBeenCalledWith({
					title: 'board',
					type: CopyElementType.ROOM,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: targetRoom,
					originalEntity: sourceRoom,
					elements: [copyStatus],
				});
			});
		});
	});
});
