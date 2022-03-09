import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, ICurrentUser } from '@shared/domain';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { RoomsUc } from '../uc/rooms.uc';
import { RoomBoardDTO } from '../types';
import { BoardResponse } from './dto/roomBoardResponse';
import { RoomsController } from './rooms.controller';

describe('rooms controller', () => {
	let controller: RoomsController;
	let mapper: RoomBoardResponseMapper;
	let uc: RoomsUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsController,
				{
					provide: RoomsUc,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
							throw new Error('please write mock for RoomsUc.getBoard');
						},
						updateVisibilityOfBoardElement(
							roomId: EntityId,
							elementId: EntityId,
							userId: EntityId,
							visibility: boolean
						): Promise<void> {
							throw new Error('please write mock for RoomsUc.updateVisibilityOfBoardElement');
						},
					},
				},
				{
					provide: RoomBoardResponseMapper,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						mapToResponse(board: RoomBoardDTO): BoardResponse {
							throw new Error('please write mock for Boardmapper.mapToResponse');
						},
					},
				},
			],
		}).compile();
		controller = module.get(RoomsController);
		mapper = module.get(RoomBoardResponseMapper);
		uc = module.get(RoomsUc);
	});

	describe('getRoomBoard', () => {
		describe('when simple room is fetched', () => {
			const setup = () => {
				const currentUser = { userId: 'userId' } as ICurrentUser;

				const ucResult = { roomId: 'id', title: 'title', displayColor: '#FFFFFF', elements: [] } as RoomBoardDTO;
				const ucSpy = jest.spyOn(uc, 'getBoard').mockImplementation(() => {
					return Promise.resolve(ucResult);
				});

				const mapperResult = new BoardResponse({ roomId: 'id', title: 'title', displayColor: '#FFFFFF', elements: [] });
				const mapperSpy = jest.spyOn(mapper, 'mapToResponse').mockImplementation(() => {
					return mapperResult;
				});
				return { currentUser, ucResult, ucSpy, mapperResult, mapperSpy };
			};

			it('should call uc with ids', async () => {
				const { currentUser, ucSpy } = setup();

				await controller.getRoomBoard('roomId', currentUser);

				expect(ucSpy).toHaveBeenCalledWith('roomId', currentUser.userId);
			});

			it('should call mapper with uc result', async () => {
				const { currentUser, ucResult, mapperSpy } = setup();

				await controller.getRoomBoard('roomId', currentUser);

				expect(mapperSpy).toHaveBeenCalledWith(ucResult);
			});

			it('should return mapped result', async () => {
				const { currentUser, mapperResult } = setup();

				const result = await controller.getRoomBoard('boardId', currentUser);

				expect(result).toEqual(mapperResult);
			});
		});
	});

	describe('patchVisibility', () => {
		it('should call uc', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const ucSpy = jest.spyOn(uc, 'updateVisibilityOfBoardElement').mockImplementation(() => {
				return Promise.resolve();
			});
			await controller.patchElementVisibility('roomid', 'elementId', { visibility: true }, currentUser);
			expect(ucSpy).toHaveBeenCalled();
		});
	});
});
