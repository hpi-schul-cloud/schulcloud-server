import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, ICurrentUser } from '@shared/domain';
import { BoardMapper } from '../mapper/board.mapper';
import { RoomsUc, Board } from '../uc/rooms.uc';
import { BoardResponse } from './dto/roomBoardResponse';
import { RoomsController } from './rooms.controller';

describe('rooms controller', () => {
	let controller: RoomsController;
	let mapper: BoardMapper;
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
						getBoard(roomId: EntityId, userId: EntityId): Promise<Board> {
							throw new Error('please write mock for RoomsUc.getBoard');
						},
					},
				},
				{
					provide: BoardMapper,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						mapToResponse(board: Board): BoardResponse {
							throw new Error('please write mock for Boardmapper.mapToResponse');
						},
					},
				},
			],
		}).compile();
		controller = module.get(RoomsController);
		mapper = module.get(BoardMapper);
		uc = module.get(RoomsUc);
	});

	describe('getContent', () => {
		describe('when simple room is fetched', () => {
			const setup = () => {
				const currentUser = { userId: 'userId' } as ICurrentUser;

				const ucResult = { content: [] } as Board;
				const ucSpy = jest.spyOn(uc, 'getBoard').mockImplementation(() => {
					return Promise.resolve(ucResult);
				});

				const mapperResult = new BoardResponse({ content: [] });
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
});
