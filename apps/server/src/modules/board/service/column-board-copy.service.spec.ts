import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, ColumnBoard, UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	courseFactory,
	linkElementFactory,
	schoolEntityFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardDoRepo } from '../repo';
import {
	BoardDoCopyService,
	SchoolSpecificFileCopyService,
	SchoolSpecificFileCopyServiceFactory,
} from './board-do-copy-service';
import { ColumnBoardCopyService } from './column-board-copy.service';

describe('column board copy service', () => {
	let module: TestingModule;
	let service: ColumnBoardCopyService;
	let doCopyService: DeepMocked<BoardDoCopyService>;
	let boardRepo: DeepMocked<BoardDoRepo>;
	let userService: DeepMocked<UserService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let fileCopyServiceFactory: DeepMocked<SchoolSpecificFileCopyServiceFactory>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: BoardDoCopyService,
					useValue: createMock<BoardDoCopyService>(),
				},
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: SchoolSpecificFileCopyServiceFactory,
					useValue: createMock<SchoolSpecificFileCopyServiceFactory>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				ColumnBoardCopyService,
			],
		}).compile();

		service = module.get(ColumnBoardCopyService);
		doCopyService = module.get(BoardDoCopyService);
		boardRepo = module.get(BoardDoRepo);
		userService = module.get(UserService);
		courseRepo = module.get(CourseRepo);
		fileCopyServiceFactory = module.get(SchoolSpecificFileCopyServiceFactory);
		copyHelperService = module.get(CopyHelperService);

		await setupEntities();
	});

	describe('when copying a column board', () => {
		const setup = () => {
			const originalSchool = schoolEntityFactory.buildWithId();
			const targetSchool = schoolEntityFactory.buildWithId();
			const course = courseFactory.buildWithId({ school: originalSchool });
			const originalExternalReference = {
				id: course.id,
				type: BoardExternalReferenceType.Course,
			};
			const originalBoard = columnBoardFactory.build({
				context: originalExternalReference,
			});

			const targetCourse = courseFactory.buildWithId();
			const destinationExternalReference = {
				id: targetCourse.id,
				type: BoardExternalReferenceType.Course,
			};

			const boardCopy = columnBoardFactory.build({
				context: originalExternalReference,
			});

			const expectedBoardCopy = {
				...boardCopy,
				props: { ...boardCopy.getProps(), context: destinationExternalReference },
			};

			const resultCopyStatus: CopyStatus = {
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};

			const expectedCopyStatus = {
				...resultCopyStatus,
				copyEntity: expectedBoardCopy,
			};

			const user = userFactory.buildWithId({ school: targetSchool });

			const fileCopyServiceMock = createMock<SchoolSpecificFileCopyService>();
			fileCopyServiceFactory.build.mockReturnValue(fileCopyServiceMock);

			boardRepo.findByClassAndId.mockResolvedValue(originalBoard);
			courseRepo.findById.mockResolvedValue(course);
			userService.findById.mockResolvedValue({ schoolId: user.school.id } as UserDO);
			doCopyService.copy.mockResolvedValue(resultCopyStatus);

			return {
				course,
				originalBoard,
				destinationExternalReference,
				user,
				resultCopyStatus,
				boardCopy,
				expectedBoardCopy,
				expectedCopyStatus,
				fileCopyServiceMock,
			};
		};

		it('should get column board do', async () => {
			const { originalBoard, destinationExternalReference, user } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(boardRepo.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, originalBoard.id);
		});

		it('should call copyService with column board do', async () => {
			const { fileCopyServiceMock, originalBoard, destinationExternalReference, user } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(doCopyService.copy).toHaveBeenCalledWith({
				fileCopyService: fileCopyServiceMock,
				original: originalBoard,
			});
		});

		describe('board title should be incremented', () => {
			it('should get board ids for reference', async () => {
				const { originalBoard, destinationExternalReference, user } = setup();
				await service.copyColumnBoard({
					originalColumnBoardId: originalBoard.id,
					destinationExternalReference,
					userId: user.id,
				});

				expect(boardRepo.findIdsByExternalReference).toHaveBeenCalledWith(destinationExternalReference);
			});

			it('should get board titles for reference', async () => {
				const { originalBoard, destinationExternalReference, user } = setup();
				const existingBoardIds = [new ObjectId().toString()];
				boardRepo.findIdsByExternalReference.mockResolvedValue(existingBoardIds);
				await service.copyColumnBoard({
					originalColumnBoardId: originalBoard.id,
					destinationExternalReference,
					userId: user.id,
				});

				expect(boardRepo.getTitlesByIds).toHaveBeenCalledWith([existingBoardIds[0]]);
			});

			it('should call helper to obtain copy name', async () => {
				const { originalBoard, destinationExternalReference, user } = setup();
				const existingBoardIds = [new ObjectId().toString()];
				const existingTitles = { [existingBoardIds[0]]: 'existingTitle' };
				boardRepo.findIdsByExternalReference.mockResolvedValue(existingBoardIds);
				boardRepo.getTitlesByIds.mockResolvedValue(existingTitles);
				await service.copyColumnBoard({
					originalColumnBoardId: originalBoard.id,
					destinationExternalReference,
					userId: user.id,
				});

				expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(originalBoard.title, ['existingTitle']);
			});

			it('should call copyService with the derived title', async () => {
				const { fileCopyServiceMock, originalBoard, destinationExternalReference, user } = setup();
				const copyTitle = 'copyTitle';
				copyHelperService.deriveCopyName.mockReturnValue(copyTitle);

				await service.copyColumnBoard({
					originalColumnBoardId: originalBoard.id,
					destinationExternalReference,
					userId: user.id,
				});
				const copyBoard = originalBoard;
				copyBoard.title = copyTitle;
				expect(doCopyService.copy).toHaveBeenCalledWith({
					fileCopyService: fileCopyServiceMock,
					original: copyBoard,
				});
			});
		});

		it('should persist copy of board, with replaced externalReference', async () => {
			const { originalBoard, destinationExternalReference, user, expectedBoardCopy } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(boardRepo.save).toHaveBeenCalledWith(expectedBoardCopy);
		});

		it('should return copyStatus', async () => {
			const { originalBoard, destinationExternalReference, user, expectedCopyStatus } = setup();
			const result = await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(result).toEqual(expectedCopyStatus);
		});
	});

	describe('when changing linked ids', () => {
		const setup = () => {
			const linkedIdBefore = new ObjectId().toString();
			const linkElement = linkElementFactory.build({
				url: `someurl/${linkedIdBefore}`,
			});
			const board = columnBoardFactory.build({
				children: [
					columnFactory.build({
						children: [
							cardFactory.build({
								children: [linkElement],
							}),
						],
					}),
				],
			});
			boardRepo.findById.mockResolvedValue(board);

			return { board, linkElement, linkedIdBefore };
		};

		it('should get board', async () => {
			const { board } = setup();

			await service.swapLinkedIds(board.id, new Map<EntityId, EntityId>());

			expect(boardRepo.findById).toHaveBeenCalledWith(board.id);
		});

		it('should update links in board', async () => {
			const { board, linkElement, linkedIdBefore } = setup();
			const expectedId = new ObjectId().toString();
			const map = new Map<EntityId, EntityId>().set(linkedIdBefore, expectedId);

			await service.swapLinkedIds(board.id, map);

			expect(linkElement.url).toEqual(`someurl/${expectedId}`);
		});

		it('should persist updates', async () => {
			const { board } = setup();

			await service.swapLinkedIds(board.id, new Map<EntityId, EntityId>());

			expect(boardRepo.save).toHaveBeenCalledWith(board);
		});
	});
});
