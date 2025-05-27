import { Test, TestingModule } from '@nestjs/testing';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@core/logger';
import { SagaService } from '@modules/saga';
import { RoomService } from '@modules/room';
import { ColumnBoardService } from '../service';
import { CopyRoomBoardsStep } from './copy-room-boards.step';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { columnBoardFactory } from '../testing';
import { roomFactory } from '@modules/room/testing';

describe('CopyRoomBoardsStep', () => {
	let module: TestingModule;
	let step: CopyRoomBoardsStep;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let roomService: DeepMocked<RoomService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CopyRoomBoardsStep,
				{ provide: SagaService, useValue: createMock<SagaService>() },
				{ provide: RoomService, useValue: createMock<RoomService>() },
				{ provide: ColumnBoardService, useValue: createMock<ColumnBoardService>() },
				{ provide: Logger, useValue: createMock<Logger>() },
			],
		}).compile();

		step = module.get(CopyRoomBoardsStep);
		columnBoardService = module.get(ColumnBoardService);
		roomService = module.get(RoomService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('execute', () => {
		it('should throw an error if the copy status does not contain a copy entity', async () => {
			const userId = 'user-id';
			const sourceRoomId = 'source-room-id';
			const targetRoomId = 'target-room-id';

			const board = columnBoardFactory.build();

			columnBoardService.findByExternalReference.mockResolvedValue([board]);

			const room = roomFactory.build();

			roomService.getSingleRoom.mockResolvedValue(room);

			columnBoardService.copyColumnBoard.mockResolvedValue({
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
			});

			await expect(step.execute({ userId, sourceRoomId, targetRoomId })).rejects.toThrow(
				'Copy status does not contain a copy entity'
			);
		});
	});
});
