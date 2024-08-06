import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseService } from '@modules/learnroom';
import { Course } from '@shared/domain/entity';
import { Group, GroupService } from '@modules/group';
import { GroupEntity } from '@modules/group/entity';
import { courseFactory, groupEntityFactory, groupFactory, setupEntities } from '@shared/testing';
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

	beforeAll(async () => {
		await setupEntities();

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
			],
		}).compile();

		strategy = module.get(AutoGroupExternalUuidStrategy);
		courseService = module.get(CourseService);
		groupService = module.get(GroupService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		describe('when the context is type course', () => {
			const setupExternalTools = () => {
				const courseId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: courseId,
						type: ToolContextType.COURSE,
					},
				});
				return { courseId, schoolExternalTool, contextExternalTool };
			};

			describe('when the course is synced with a group that has an external ID', () => {
				const setup = () => {
					const { courseId, schoolExternalTool, contextExternalTool } = setupExternalTools();
					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: Course = courseFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);

					const groupDo: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: groupEntity.externalSource?.externalId,
						},
					});

					courseService.findById.mockResolvedValue(course);
					groupService.findById.mockResolvedValue(groupDo);

					return {
						group: groupDo,
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
					const { courseId, schoolExternalTool, contextExternalTool } = setupExternalTools();

					const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
					const course: Course = courseFactory.buildWithId(
						{
							name: 'Synced Course',
							syncedWithGroup: groupEntity,
						},
						courseId
					);

					const groupDo: Group = groupFactory.build({
						id: groupEntity.id,
						externalSource: {
							externalId: undefined,
						},
					});

					courseService.findById.mockResolvedValue(course);
					groupService.findById.mockResolvedValue(groupDo);

					return {
						group: groupDo,
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
					const { courseId, schoolExternalTool, contextExternalTool } = setupExternalTools();

					const course: Course = courseFactory.buildWithId(
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
			const setup = () => {
				const courseId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: courseId,
						type: ToolContextType.BOARD_ELEMENT,
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
