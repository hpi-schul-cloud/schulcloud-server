import { createMock } from '@golevelup/ts-jest';
import { AnyBoardNode, BoardExternalReferenceType, BoardNodeService } from '@modules/board';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseFeatures, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoomService } from '@modules/room';
import { schoolEntityFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardFeature, ElementReferenceType } from '../board/domain';
import { cardFactory, columnBoardFactory, columnFactory } from '../board/testing';
import { LegacySchoolService } from '../legacy-school';
import { roomFactory } from '../room/testing';
import { BoardContextApiHelperService } from './board-context-api-helper.service';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from './board-context.config';

describe('BoardContextApiHelperService', () => {
	let module: TestingModule;
	let service: BoardContextApiHelperService;
	let courseService: jest.Mocked<CourseService>;
	let roomService: jest.Mocked<RoomService>;
	let userService: jest.Mocked<UserService>;
	let boardNodeService: jest.Mocked<BoardNodeService>;
	let legacySchoolService: jest.Mocked<LegacySchoolService>;
	let boardContextApiConfig: BoardContextPublicApiConfig;

	beforeEach(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
		module = await Test.createTestingModule({
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
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: BOARD_CONTEXT_PUBLIC_API_CONFIG,
					useValue: {
						FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED: false,
						FEATURE_VIDEOCONFERENCE_ENABLED: false,
					},
				},
			],
		}).compile();

		service = module.get<BoardContextApiHelperService>(BoardContextApiHelperService);
		courseService = module.get(CourseService);
		roomService = module.get(RoomService);
		userService = module.get(UserService);
		boardNodeService = module.get(BoardNodeService);
		legacySchoolService = module.get(LegacySchoolService);
		boardContextApiConfig = module.get<BoardContextPublicApiConfig>(BOARD_CONTEXT_PUBLIC_API_CONFIG);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getSchoolIdForBoardNode', () => {
		it('should return schoolId for course context', async () => {
			const school = schoolEntityFactory.build();
			const course = courseEntityFactory.build({ school });
			const card = cardFactory.build();
			const column = columnFactory.build({ children: [card] });
			const columnBoard = columnBoardFactory.build({
				context: { type: BoardExternalReferenceType.Course, id: 'course.id' },
			});
			columnBoard.addChild(column);

			boardNodeService.findById.mockResolvedValueOnce(card);
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

			boardNodeService.findRoot.mockResolvedValueOnce(columnBoard);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
			roomService.getSingleRoom.mockResolvedValueOnce(room);

			const result = await service.getSchoolIdForBoardNode('nodeId');

			expect(result).toBe(room.schoolId);
		});
	});

	describe('getFeaturesForBoardNode', () => {
		describe('when context is course', () => {
			const setup = () => {
				const course = courseEntityFactory.build();
				const column = columnFactory.build();
				const columnBoard = columnBoardFactory.build({
					context: { type: BoardExternalReferenceType.Course, id: 'course.id' },
					children: [column],
				});

				courseService.findById.mockResolvedValueOnce(course);
				boardNodeService.findById.mockResolvedValueOnce(column);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);

				return { boardNode: column, course };
			};

			describe('when video conference is enabled for course', () => {
				describe('and video conference is enabled for school and config', () => {
					it('should return video conference feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(true);
						boardContextApiConfig.featureVideoconferenceEnabled = true;
						boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([BoardFeature.VIDEOCONFERENCE]);
					});
				});

				describe('and video conference is disabled for school', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(false);
						boardContextApiConfig.featureVideoconferenceEnabled = true;
						boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;
						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});

				describe('and video conference is disabled for instance config', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(true);
						boardContextApiConfig.featureVideoconferenceEnabled = false;
						boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});

				describe('and video conference is disabled for board config', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(true);
						boardContextApiConfig.featureVideoconferenceEnabled = true;
						boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = false;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});
			});

			describe('when video conference is disabled for course', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					const course = courseEntityFactory.build();
					courseService.findById.mockResolvedValueOnce(course);
					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					boardContextApiConfig.featureVideoconferenceEnabled = true;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled entirely', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					const course = courseEntityFactory.build();
					courseService.findById.mockResolvedValueOnce(course);
					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					boardContextApiConfig.featureVideoconferenceEnabled = false;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = false;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});
		});

		describe('when context is room', () => {
			const setup = () => {
				const room = roomFactory.build();
				const column = columnFactory.build();
				const columnBoard = columnBoardFactory.build({
					context: { type: BoardExternalReferenceType.Room, id: 'room.id' },
					children: [column],
				});

				roomService.getSingleRoom.mockResolvedValueOnce(room);
				boardNodeService.findById.mockResolvedValueOnce(column);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);

				return { boardNode: column, room };
			};

			describe('when video conference is enabled for school and config', () => {
				it('should return video conference feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					boardContextApiConfig.featureVideoconferenceEnabled = true;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([BoardFeature.VIDEOCONFERENCE]);
				});
			});

			describe('when video conference is disabled for school', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(false);
					boardContextApiConfig.featureVideoconferenceEnabled = true;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled for instance config', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					boardContextApiConfig.featureVideoconferenceEnabled = false;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled for board config', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					boardContextApiConfig.featureVideoconferenceEnabled = true;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = false;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled entirely', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(false);
					boardContextApiConfig.featureVideoconferenceEnabled = false;
					boardContextApiConfig.featureColumnBoardVideoconferenceEnabled = false;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});
		});
	});

	describe('getParentsOfElement', () => {
		describe('when root parent element is course', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { type: BoardExternalReferenceType.Course, id: 'courseId' },
				});
				const course = courseEntityFactory.build();
				const elementId = 'elementId';

				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
				courseService.findById.mockResolvedValueOnce(course);

				return { elementId, course, columnBoard };
			};

			it('should return the parents of the element', async () => {
				const { elementId, course, columnBoard } = setup();

				const result = await service.getParentsOfElement(elementId);

				const expectedResult = [
					{
						id: columnBoard.context.id,
						name: course.name,
						type: BoardExternalReferenceType.Course,
					},
					{
						id: columnBoard.id,
						name: columnBoard.title,
						type: ElementReferenceType.BOARD,
					},
				];
				expect(result).toEqual(expectedResult);
			});
		});

		describe('when root parent element is room', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { type: BoardExternalReferenceType.Room, id: 'roomId' },
				});
				const room = roomFactory.build();
				const elementId = 'elementId';

				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return { elementId, room, columnBoard };
			};

			it('should return the parents of the element', async () => {
				const { elementId, room, columnBoard } = setup();

				const result = await service.getParentsOfElement(elementId);

				const expectedResult = [
					{
						id: columnBoard.context.id,
						name: room.name,
						type: BoardExternalReferenceType.Room,
					},
					{
						id: columnBoard.id,
						name: columnBoard.title,
						type: ElementReferenceType.BOARD,
					},
				];
				expect(result).toEqual(expectedResult);
			});
		});

		describe('when root parent element is user', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { type: BoardExternalReferenceType.User, id: 'userId' },
				});
				const user = userFactory.build();
				const elementId = 'elementId';

				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);
				userService.getUserEntityWithRoles.mockResolvedValueOnce(user);

				return { elementId, user, columnBoard };
			};

			it('should return the parents of the element', async () => {
				const { elementId, user, columnBoard } = setup();

				const result = await service.getParentsOfElement(elementId);

				const expectedResult = [
					{
						id: columnBoard.context.id,
						name: `${user.firstName} ${user.lastName}`,
						type: BoardExternalReferenceType.User,
					},
					{
						id: columnBoard.id,
						name: columnBoard.title,
						type: ElementReferenceType.BOARD,
					},
				];
				expect(result).toEqual(expectedResult);
			});
		});

		describe('when root parent element is unsupported', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { type: 'unsupportedType' as BoardExternalReferenceType, id: 'unsupportedId' },
				});
				const elementId = 'elementId';

				boardNodeService.findByClassAndId.mockResolvedValueOnce(columnBoard);

				return { elementId, columnBoard };
			};

			it('should throw BadRequestException', async () => {
				const { elementId } = setup();

				await expect(service.getParentsOfElement(elementId)).rejects.toThrowError(
					new Error('Unsupported board reference type unsupportedType')
				);
			});
		});
	});
});
