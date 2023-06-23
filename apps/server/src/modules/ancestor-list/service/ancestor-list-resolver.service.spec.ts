import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain';
import { columnBoardFactory, courseFactory, setupEntities } from '@shared/testing';
import { ColumnBoardService } from '@src/modules/board';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { AncestorEntityType } from '../controller/dto/ancestor.response';
import { AncestorListResolverService } from './ancestor-list-resolver.service';

describe(AncestorListResolverService.name, () => {
	let module: TestingModule;
	let service: AncestorListResolverService;
	let courseService: DeepMocked<CourseService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AncestorListResolverService,
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		service = module.get(AncestorListResolverService);
		courseService = module.get(CourseService);
		columnBoardService = module.get(ColumnBoardService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getBreadCrumbsFor', () => {
		describe('when having a board with a parent of type course', () => {
			const setup = () => {
				const course = courseFactory.buildWithId();
				const columnBoard = columnBoardFactory.build();
				columnBoard.context = {
					id: course.id,
					type: BoardExternalReferenceType.Course,
				};

				return { columnBoard, course };
			};

			it('should return the course itself', async () => {
				const { course, columnBoard } = setup();
				columnBoardService.findById.mockResolvedValue(columnBoard);
				courseService.findById.mockResolvedValue(course);

				const ancestors = await service.getAncestorsOf(AncestorEntityType.COURSE, course.id);
				expect(ancestors).toHaveLength(1);

				const [first] = ancestors;
				expect(first.text).toEqual(course.name);
				expect(first.id).toEqual(course.id);
			});

			it('should return ancestor list including the course and columboard itself', async () => {
				const { course, columnBoard } = setup();
				columnBoardService.findById.mockResolvedValue(columnBoard);
				courseService.findById.mockResolvedValue(course);

				const ancestors = await service.getAncestorsOf(AncestorEntityType.COLUMN_BOARD, columnBoard.id);
				expect(ancestors).toHaveLength(2);

				const [first, second] = ancestors;
				expect(first.text).toEqual(course.name);
				expect(first.id).toEqual(course.id);
				expect(second.text).toEqual(columnBoard.title);
				expect(second.id).toEqual(columnBoard.id);
			});
		});
	});
});
