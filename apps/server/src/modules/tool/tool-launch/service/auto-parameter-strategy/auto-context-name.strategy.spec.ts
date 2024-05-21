import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ColumnBoardService, ContentElementService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, ColumnBoard, ExternalToolElement } from '@shared/domain/domainobject';
import { Course } from '@shared/domain/entity';
import { columnBoardFactory, courseFactory, externalToolElementFactory, setupEntities } from '@shared/testing';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { ParameterTypeNotImplementedLoggableException } from '../../error';
import { AutoContextNameStrategy } from './auto-context-name.strategy';

describe(AutoContextNameStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoContextNameStrategy;

	let courseService: DeepMocked<CourseService>;
	let contentElementService: DeepMocked<ContentElementService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				AutoContextNameStrategy,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
			],
		}).compile();

		strategy = module.get(AutoContextNameStrategy);
		courseService = module.get(CourseService);
		contentElementService = module.get(ContentElementService);
		columnBoardService = module.get(ColumnBoardService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		describe('when the tool context is "course"', () => {
			const setup = () => {
				const courseId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: courseId,
						type: ToolContextType.COURSE,
					},
				});

				const course: Course = courseFactory.buildWithId(
					{
						name: 'testName',
					},
					courseId
				);

				courseService.findById.mockResolvedValue(course);

				return {
					schoolExternalTool,
					contextExternalTool,
					course,
				};
			};

			it('should return the course name', async () => {
				const { schoolExternalTool, contextExternalTool, course } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toEqual(course.name);
			});
		});

		describe('when the tool context is "board element" and the board context is "course"', () => {
			const setup = () => {
				const boardElementId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: boardElementId,
						type: ToolContextType.BOARD_ELEMENT,
					},
				});

				const course: Course = courseFactory.buildWithId({
					name: 'testName',
				});

				const externalToolElement: ExternalToolElement = externalToolElementFactory.build();

				const columnBoard: ColumnBoard = columnBoardFactory.build({
					context: {
						id: course.id,
						type: BoardExternalReferenceType.Course,
					},
				});

				courseService.findById.mockResolvedValue(course);
				contentElementService.findById.mockResolvedValue(externalToolElement);
				columnBoardService.findByDescendant.mockResolvedValue(columnBoard);

				return {
					schoolExternalTool,
					contextExternalTool,
					course,
				};
			};

			it('should return the course name', async () => {
				const { schoolExternalTool, contextExternalTool, course } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toEqual(course.name);
			});
		});

		describe('when the tool context is "board element" and the board context is unknown', () => {
			const setup = () => {
				const boardElementId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: boardElementId,
						type: ToolContextType.BOARD_ELEMENT,
					},
				});

				const externalToolElement: ExternalToolElement = externalToolElementFactory.build();

				const columnBoard: ColumnBoard = columnBoardFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: 'unknown' as unknown as BoardExternalReferenceType,
					},
				});

				contentElementService.findById.mockResolvedValue(externalToolElement);
				columnBoardService.findByDescendant.mockResolvedValue(columnBoard);

				return {
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return undefined', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toBeUndefined();
			});
		});

		describe('when a lookup for a context name is not implemented', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						type: 'unknownContext' as unknown as ToolContextType,
					},
				});

				return {
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a ParameterNotImplementedLoggableException', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				await expect(strategy.getValue(schoolExternalTool, contextExternalTool)).rejects.toThrow(
					ParameterTypeNotImplementedLoggableException
				);
			});
		});
	});
});
