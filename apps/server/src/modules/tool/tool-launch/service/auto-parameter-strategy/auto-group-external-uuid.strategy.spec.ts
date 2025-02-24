import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardNodeService } from '@modules/board';
import { columnBoardFactory, externalToolElementFactory } from '@modules/board/testing';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { Group, GroupService } from '@modules/group';
import { GroupEntity } from '@modules/group/entity';
import { groupEntityFactory, groupFactory } from '@modules/group/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { AutoGroupExternalUuidStrategy } from './auto-group-external-uuid-strategy.service';

describe(AutoGroupExternalUuidStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoGroupExternalUuidStrategy;

	let courseService: DeepMocked<CourseService>;
	let groupService: DeepMocked<GroupService>;
	let boardNodeService: DeepMocked<BoardNodeService>;

	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				AutoGroupExternalUuidStrategy,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		strategy = module.get(AutoGroupExternalUuidStrategy);
		courseService = module.get(CourseService);
		groupService = module.get(GroupService);
		boardNodeService = module.get(BoardNodeService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		describe('when the context is type course', () => {
			describe('when the course is synced with a group that has an external ID', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: courseId,
							type: ToolContextType.COURSE,
						},
					});
					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);

					const group: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: groupEntity.externalSource?.externalId,
						},
					});

					courseService.findById.mockResolvedValue(course);
					groupService.findById.mockResolvedValue(group);

					return {
						group,
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return the external ID from the synced group', async () => {
					const { group, schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toEqual(group.externalSource?.externalId);
				});
			});

			describe('when the course is synced with a group that has no external ID', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: courseId,
							type: ToolContextType.COURSE,
						},
					});
					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);

					const group: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: undefined,
						},
					});

					courseService.findById.mockResolvedValue(course);
					groupService.findById.mockResolvedValue(group);

					return {
						group,
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return undefined', async () => {
					const { schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toBeUndefined();
				});
			});

			describe('when the course is not synced with any group', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: courseId,
							type: ToolContextType.COURSE,
						},
					});
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: undefined,
						},
						courseId
					);

					courseService.findById.mockResolvedValue(course);

					return {
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return undefined', async () => {
					const { schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toBeUndefined();
				});
			});
		});

		describe('when the context is type board element', () => {
			describe('when the boards course is synced with a group that has an external ID', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const boardElementId = new ObjectId().toHexString();

					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: boardElementId,
							type: ToolContextType.BOARD_ELEMENT,
						},
					});
					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);
					const group: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: groupEntity.externalSource?.externalId,
						},
					});

					const externalToolElement = externalToolElementFactory.build({ id: boardElementId });
					const board = columnBoardFactory.build({
						context: {
							id: course.id,
							type: BoardExternalReferenceType.Course,
						},
						children: [externalToolElement],
					});

					boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
					boardNodeService.findRoot.mockResolvedValueOnce(board);
					courseService.findById.mockResolvedValueOnce(course);
					groupService.findById.mockResolvedValueOnce(group);

					return {
						group,
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return the external ID from the synced group', async () => {
					const { group, schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toEqual(group.externalSource?.externalId);
				});
			});

			describe('when the boards has no course context', () => {
				const setup = () => {
					const boardElementId = new ObjectId().toHexString();

					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: boardElementId,
							type: ToolContextType.BOARD_ELEMENT,
						},
					});

					const externalToolElement = externalToolElementFactory.build({ id: boardElementId });
					const board = columnBoardFactory.build({
						context: {
							id: new ObjectId().toHexString(),
							type: BoardExternalReferenceType.User,
						},
						children: [externalToolElement],
					});

					boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
					boardNodeService.findRoot.mockResolvedValueOnce(board);

					return {
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return undefined', async () => {
					const { schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toBeUndefined();
				});
			});

			describe('when the boards course is synced with a group that has no external ID', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const boardElementId = new ObjectId().toHexString();

					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: boardElementId,
							type: ToolContextType.BOARD_ELEMENT,
						},
					});
					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);
					const group: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: undefined,
						},
					});

					const externalToolElement = externalToolElementFactory.build({ id: boardElementId });
					const board = columnBoardFactory.build({
						context: {
							id: course.id,
							type: BoardExternalReferenceType.Course,
						},
						children: [externalToolElement],
					});

					boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
					boardNodeService.findRoot.mockResolvedValueOnce(board);
					courseService.findById.mockResolvedValueOnce(course);
					groupService.findById.mockResolvedValueOnce(group);

					return {
						group,
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return undefined', async () => {
					const { schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toBeUndefined();
				});
			});

			describe('when the boards course is not synced with any group', () => {
				const setup = () => {
					const courseId = new ObjectId().toHexString();
					const boardElementId = new ObjectId().toHexString();

					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
						contextRef: {
							id: boardElementId,
							type: ToolContextType.BOARD_ELEMENT,
						},
					});
					const course: CourseEntity = courseEntityFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: undefined,
						},
						courseId
					);

					const externalToolElement = externalToolElementFactory.build({ id: boardElementId });
					const board = columnBoardFactory.build({
						context: {
							id: course.id,
							type: BoardExternalReferenceType.Course,
						},
						children: [externalToolElement],
					});

					boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
					boardNodeService.findRoot.mockResolvedValueOnce(board);
					courseService.findById.mockResolvedValueOnce(course);

					return {
						schoolExternalTool,
						contextExternalTool,
					};
				};

				it('should return undefined', async () => {
					const { schoolExternalTool, contextExternalTool } = setup();

					const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

					expect(result).toBeUndefined();
				});
			});
		});

		describe('when the context is type media board', () => {
			const setup = () => {
				const courseId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: courseId,
						type: ToolContextType.MEDIA_BOARD,
					},
				});

				return {
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return undefined', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				const result = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toBeUndefined();
			});
		});
	});
});
