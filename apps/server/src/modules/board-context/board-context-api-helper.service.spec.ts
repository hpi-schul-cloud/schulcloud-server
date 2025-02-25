import { createMock } from '@golevelup/ts-jest';
import { AnyBoardNode, BoardExternalReferenceType, BoardNodeService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { RoomService } from '@modules/room';
import { schoolEntityFactory } from '@modules/school/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseFeatures, CourseGroup } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { BoardFeature } from '../board/domain';
import { cardFactory, columnBoardFactory, columnFactory } from '../board/testing';
import { LegacySchoolService } from '../legacy-school';
import { roomFactory } from '../room/testing';
import { ServerConfig } from '../server';
import { BoardContextApiHelperService } from './board-context-api-helper.service';

describe('BoardContextApiHelperService', () => {
	let module: TestingModule;
	let service: BoardContextApiHelperService;
	let courseService: jest.Mocked<CourseService>;
	let roomService: jest.Mocked<RoomService>;
	let boardNodeService: jest.Mocked<BoardNodeService>;
	let legacySchoolService: jest.Mocked<LegacySchoolService>;
	const config: Pick<ServerConfig, 'FEATURE_VIDEOCONFERENCE_ENABLED' | 'FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED'> =
		{
			FEATURE_VIDEOCONFERENCE_ENABLED: false,
			FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED: false,
		};

	beforeEach(async () => {
		await setupEntities([Course, CourseGroup]);
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
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof typeof config) => config[key]),
					},
				},
			],
		}).compile();

		service = module.get<BoardContextApiHelperService>(BoardContextApiHelperService);
		courseService = module.get(CourseService);
		roomService = module.get(RoomService);
		boardNodeService = module.get(BoardNodeService);
		legacySchoolService = module.get(LegacySchoolService);
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
			const course = courseFactory.build({ school });
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
				const course = courseFactory.build();
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
						config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
						config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([BoardFeature.VIDEOCONFERENCE]);
					});
				});

				describe('and video conference is disabled for school', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(false);
						config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
						config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;
						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});

				describe('and video conference is disabled for instance config', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(true);
						config.FEATURE_VIDEOCONFERENCE_ENABLED = false;
						config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});

				describe('and video conference is disabled for board config', () => {
					it('should not return feature', async () => {
						const { boardNode, course } = setup();

						course.features = [CourseFeatures.VIDEOCONFERENCE];
						legacySchoolService.hasFeature.mockResolvedValueOnce(true);
						config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
						config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = false;

						const result = await service.getFeaturesForBoardNode(boardNode.id);

						expect(result).toEqual([]);
					});
				});
			});

			describe('when video conference is disabled for course', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					const course = courseFactory.build();
					courseService.findById.mockResolvedValueOnce(course);
					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled entirely', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					const course = courseFactory.build();
					courseService.findById.mockResolvedValueOnce(course);
					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = false;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = false;

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
					config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([BoardFeature.VIDEOCONFERENCE]);
				});
			});

			describe('when video conference is disabled for school', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(false);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled for instance config', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = false;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = true;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled for board config', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(true);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = true;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = false;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});

			describe('when video conference is disabled entirely', () => {
				it('should not return feature', async () => {
					const { boardNode } = setup();

					legacySchoolService.hasFeature.mockResolvedValueOnce(false);
					config.FEATURE_VIDEOCONFERENCE_ENABLED = false;
					config.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = false;

					const result = await service.getFeaturesForBoardNode(boardNode.id);

					expect(result).toEqual([]);
				});
			});
		});
	});
});
