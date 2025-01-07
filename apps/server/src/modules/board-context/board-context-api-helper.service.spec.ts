import { createMock } from '@golevelup/ts-jest';
import { AnyBoardNode, BoardExternalReferenceType, BoardNodeService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { RoomService } from '@modules/room';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, schoolEntityFactory } from '@shared/testing';
import { columnBoardFactory } from '../board/testing';
import { roomFactory } from '../room/testing';
import { BoardContextApiHelperService } from './board-context-api-helper.service';

describe('BoardContextApiHelperService', () => {
	let service: BoardContextApiHelperService;
	let courseService: jest.Mocked<CourseService>;
	let roomService: jest.Mocked<RoomService>;
	let boardNodeService: jest.Mocked<BoardNodeService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BoardContextApiHelperService,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		service = module.get<BoardContextApiHelperService>(BoardContextApiHelperService);
		courseService = module.get(CourseService);
		roomService = module.get(RoomService);
		boardNodeService = module.get(BoardNodeService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getSchoolIdForBoardNode', () => {
		it('should return schoolId for course context', async () => {
			const course = courseFactory.build({ students: [] });
			const columnBoard = columnBoardFactory.build({
				context: { type: BoardExternalReferenceType.Course, id: course.id },
			}) as AnyBoardNode;
			const boardNode = { id: 'boardId' };

			jest.spyOn(service as any, 'getBoardNode').mockResolvedValueOnce(boardNode);
			boardNodeService.findRoot.mockResolvedValueOnce(columnBoard);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
			courseService.findById.mockResolvedValueOnce(course);

			const result = await service.getSchoolIdForBoardNode('nodeId');

			expect(result).toBe(course.school.id);
		});

		it('should return schoolId for room context', async () => {
			const school = schoolEntityFactory.build();
			const room = roomFactory.build({ schoolId: school.id });
			const columnBoard = columnBoardFactory.build({
				context: { type: BoardExternalReferenceType.Room, id: room.id },
			}) as AnyBoardNode;
			const boardNode = { id: 'boardId' };

			jest.spyOn(service as any, 'getBoardNode').mockResolvedValueOnce(boardNode);
			boardNodeService.findRoot.mockResolvedValueOnce(columnBoard);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
			roomService.getSingleRoom.mockResolvedValueOnce(room);

			const result = await service.getSchoolIdForBoardNode('nodeId');

			expect(result).toBe(room.schoolId);
		});
	});
});
