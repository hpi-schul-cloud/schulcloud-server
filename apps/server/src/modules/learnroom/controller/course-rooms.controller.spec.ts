import { createMock } from '@golevelup/ts-jest';
import { CopyApiResponse, CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { currentUserFactory } from '@shared/testing';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { RoomBoardDTO } from '../types';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { LessonCopyUC } from '../uc/lesson-copy.uc';
import { CourseRoomsUc } from '../uc/course-rooms.uc';
import { SingleColumnBoardResponse } from './dto';
import { CourseRoomsController } from './course-rooms.controller';

describe('course-rooms controller', () => {
	let controller: CourseRoomsController;
	let mapper: RoomBoardResponseMapper;
	let uc: CourseRoomsUc;
	let courseCopyUc: CourseCopyUC;
	let lessonCopyUc: LessonCopyUC;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				CourseRoomsController,
				{
					provide: CourseRoomsUc,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
							throw new Error('please write mock for RoomsUc.getBoard');
						},
						updateVisibilityOfLegacyBoardElement(
							roomId: EntityId, // eslint-disable-line @typescript-eslint/no-unused-vars
							elementId: EntityId, // eslint-disable-line @typescript-eslint/no-unused-vars
							userId: EntityId, // eslint-disable-line @typescript-eslint/no-unused-vars
							visibility: boolean // eslint-disable-line @typescript-eslint/no-unused-vars
						): Promise<void> {
							throw new Error('please write mock for RoomsUc.updateVisibilityOfBoardElement');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						reorderBoardElements(roomId: EntityId, userId: EntityId, orderedList: EntityId[]): Promise<void> {
							throw new Error('please write mock for RoomsUc.reorderBoardElements');
						},
					},
				},
				{
					provide: CourseCopyUC,
					useValue: createMock<CourseCopyUC>(),
				},
				{
					provide: LessonCopyUC,
					useValue: createMock<LessonCopyUC>(),
				},
				{
					provide: RoomBoardResponseMapper,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						mapToResponse(board: RoomBoardDTO): SingleColumnBoardResponse {
							throw new Error('please write mock for Boardmapper.mapToResponse');
						},
					},
				},
			],
		}).compile();
		controller = module.get(CourseRoomsController);
		mapper = module.get(RoomBoardResponseMapper);
		uc = module.get(CourseRoomsUc);
		courseCopyUc = module.get(CourseCopyUC);
		lessonCopyUc = module.get(LessonCopyUC);
	});

	describe('getRoomBoard', () => {
		describe('when simple room is fetched', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();

				const ucResult = {
					roomId: 'id',
					title: 'title',
					displayColor: '#FFFFFF',
					elements: [],
					isArchived: false,
					isSynchronized: false,
				} as RoomBoardDTO;
				const ucSpy = jest.spyOn(uc, 'getBoard').mockImplementation(() => Promise.resolve(ucResult));

				const mapperResult = new SingleColumnBoardResponse({
					roomId: 'id',
					title: 'title',
					displayColor: '#FFFFFF',
					elements: [],
					isArchived: false,
					isSynchronized: false,
				});
				const mapperSpy = jest.spyOn(mapper, 'mapToResponse').mockImplementation(() => mapperResult);
				return { currentUser, ucResult, ucSpy, mapperResult, mapperSpy };
			};

			it('should call uc with ids', async () => {
				const { currentUser, ucSpy } = setup();

				await controller.getRoomBoard({ roomId: 'roomId' }, currentUser);

				expect(ucSpy).toHaveBeenCalledWith('roomId', currentUser.userId);
			});

			it('should call mapper with uc result', async () => {
				const { currentUser, ucResult, mapperSpy } = setup();

				await controller.getRoomBoard({ roomId: 'roomId' }, currentUser);

				expect(mapperSpy).toHaveBeenCalledWith(ucResult);
			});

			it('should return mapped result', async () => {
				const { currentUser, mapperResult } = setup();

				const result = await controller.getRoomBoard({ roomId: 'roomId' }, currentUser);

				expect(result).toEqual(mapperResult);
			});
		});
	});

	describe('patchVisibility', () => {
		it('should call uc', async () => {
			const currentUser = currentUserFactory.build();
			const ucSpy = jest.spyOn(uc, 'updateVisibilityOfLegacyBoardElement').mockImplementation(() => Promise.resolve());
			await controller.patchElementVisibility(
				{ roomId: 'roomid', elementId: 'elementId' },
				{ visibility: true },
				currentUser
			);
			expect(ucSpy).toHaveBeenCalled();
		});
	});

	describe('patchOrder', () => {
		it('should call uc', async () => {
			const currentUser = currentUserFactory.build();
			const ucSpy = jest.spyOn(uc, 'reorderBoardElements').mockImplementation(() => Promise.resolve());
			await controller.patchOrderingOfElements({ roomId: 'roomid' }, { elements: ['id', 'id', 'id'] }, currentUser);
			expect(ucSpy).toHaveBeenCalledWith('roomid', currentUser.userId, ['id', 'id', 'id']);
		});
	});

	describe('copyCourse', () => {
		describe('when course should be copied via API call', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const ucResult = {
					title: 'example title',
					type: 'COURSE' as CopyElementType,
					status: 'SUCCESS' as CopyStatusEnum,
					elements: [],
				} as CopyStatus;
				const ucSpy = jest.spyOn(courseCopyUc, 'copyCourse').mockImplementation(() => Promise.resolve(ucResult));
				return { currentUser, ucSpy };
			};
			it('should call uc', async () => {
				const { currentUser, ucSpy } = setup();

				await controller.copyCourse(currentUser, { roomId: 'roomId' });
				expect(ucSpy).toHaveBeenCalledWith(currentUser.userId, 'roomId');
			});

			it('should return result of correct type', async () => {
				const { currentUser } = setup();

				const result = await controller.copyCourse(currentUser, { roomId: 'roomId' });
				expect(result).toBeInstanceOf(CopyApiResponse);
			});
		});
	});

	describe('copyLesson', () => {
		describe('when lesson should be copied via API call', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const ucResult = {
					title: 'example title',
					type: 'LESSON' as CopyElementType,
					status: 'SUCCESS' as CopyStatusEnum,
					elements: [],
				} as CopyStatus;
				const ucSpy = jest.spyOn(lessonCopyUc, 'copyLesson').mockImplementation(() => Promise.resolve(ucResult));
				return { currentUser, ucSpy };
			};

			it('should call uc with parentId', async () => {
				const { currentUser, ucSpy } = setup();

				await controller.copyLesson(currentUser, { lessonId: 'lessonId' }, { courseId: 'id' });
				expect(ucSpy).toHaveBeenCalledWith(currentUser.userId, 'lessonId', {
					courseId: 'id',
					userId: currentUser.userId,
				});
			});

			it('should return result of correct type', async () => {
				const { currentUser } = setup();

				const result = await controller.copyLesson(currentUser, { lessonId: 'lessonId' }, {});
				expect(result).toBeInstanceOf(CopyApiResponse);
			});
		});
	});
});
