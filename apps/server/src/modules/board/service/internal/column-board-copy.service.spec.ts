import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user/service/user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { courseFactory, setupEntities, userDoFactory } from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client/service/files-storage-client.service';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardFactory } from '../../testing';
import { BoardNodeService } from '../board-node.service';
import { ColumnBoardCopyService } from './column-board-copy.service';
import { ColumnBoardTitleService } from './column-board-title.service';
// Important: Don't move the BoardNodeCopyService import up to prevent import cycle!
import { BoardNodeCopyService } from './board-node-copy.service';

describe(ColumnBoardCopyService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardCopyService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let userService: DeepMocked<UserService>;
	let boardNodeCopyService: DeepMocked<BoardNodeCopyService>;
	let columnBoardTitleService: DeepMocked<ColumnBoardTitleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardCopyService,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ColumnBoardTitleService,
					useValue: createMock<ColumnBoardTitleService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: BoardNodeCopyService,
					useValue: createMock<BoardNodeCopyService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: ColumnBoardTitleService,
					useValue: createMock<ColumnBoardTitleService>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardCopyService);
		boardNodeService = module.get(BoardNodeService);
		courseRepo = module.get(CourseRepo);
		userService = module.get(UserService);
		boardNodeCopyService = module.get(BoardNodeCopyService);
		columnBoardTitleService = module.get(ColumnBoardTitleService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyColumnBoard', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const user = userDoFactory.build({ id: userId });
			userService.findById.mockResolvedValueOnce(user);
			const course = courseFactory.buildWithId();
			courseRepo.findById.mockResolvedValueOnce(course);
			const originalBoard = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			boardNodeService.findByClassAndId.mockResolvedValueOnce(originalBoard);

			const boardCopy = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const status: CopyStatus = {
				copyEntity: boardCopy,
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			boardNodeCopyService.copy.mockResolvedValueOnce(status);

			return { originalBoard, userId };
		};

		it('should find the original board', async () => {
			const { originalBoard, userId } = setup();

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(boardNodeService.findByClassAndId).toHaveBeenCalled();
		});

		it('should find the user', async () => {
			const { originalBoard, userId } = setup();

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(userService.findById).toHaveBeenCalled();
		});

		it('should find the course', async () => {
			const { originalBoard, userId } = setup();

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(courseRepo.findById).toHaveBeenCalled();
		});

		it('should call service to copy the board', async () => {
			const { originalBoard, userId } = setup();

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
				copyTitle: 'Another Title',
			});

			expect(boardNodeCopyService.copy).toHaveBeenCalled();
		});

		it('should set the title of the copied board', async () => {
			const { originalBoard, userId } = setup();
			const copyTitle = 'Another Title';

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
				copyTitle,
			});

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(expect.objectContaining({ title: copyTitle }));
		});

		it('should derive the title of the copied board', async () => {
			const { originalBoard, userId } = setup();
			const derivedTitle = 'Derived Title';
			columnBoardTitleService.deriveColumnBoardTitle.mockResolvedValueOnce(derivedTitle);

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(expect.objectContaining({ title: derivedTitle }));
		});

		it('should set the context of the copied board', async () => {
			const { originalBoard, userId } = setup();
			const destinationExternalReference = {
				id: new ObjectId().toHexString(),
				type: BoardExternalReferenceType.Course,
			};

			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId,
			});

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(
				expect.objectContaining({ context: destinationExternalReference })
			);
		});

		it('should return the copy status', async () => {
			const { originalBoard, userId } = setup();
			const copyStatus = await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(copyStatus).toBeDefined();
			expect(copyStatus.copyEntity).toBeDefined();
		});

		it('should not affect the original board', async () => {
			const { originalBoard, userId } = setup();
			const copyStatus = await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference: originalBoard.context,
				userId,
			});

			expect(copyStatus.originalEntity).toBe(originalBoard);
		});
	});

	describe('when the copy response is not a ColumnBoard', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const user = userDoFactory.build({ id: userId });
			userService.findById.mockResolvedValueOnce(user);
			const course = courseFactory.buildWithId();
			courseRepo.findById.mockResolvedValueOnce(course);
			const originalBoard = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			boardNodeService.findByClassAndId.mockResolvedValueOnce(originalBoard);

			return { originalBoard, userId };
		};

		it('should throw an error if the board is not a column board', async () => {
			const { originalBoard, userId } = setup();

			const boardCopy = { ...originalBoard, id: new ObjectId().toHexString(), type: 'not-a-column-board' };
			const status: CopyStatus = {
				copyEntity: boardCopy,
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			boardNodeCopyService.copy.mockResolvedValueOnce(status);

			await expect(
				service.copyColumnBoard({
					originalColumnBoardId: originalBoard.id,
					destinationExternalReference: originalBoard.context,
					userId,
				})
			).rejects.toThrowError('expected copy of columnboard to be a columnboard');
		});
	});
});
