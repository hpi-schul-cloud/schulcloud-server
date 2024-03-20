import { createMock } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common/';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, DashboardEntity, GridElement } from '@shared/domain/entity';
import { SortOrder } from '@shared/domain/interface';
import { EntityId, LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { CourseRepo, IDashboardRepo } from '@shared/repo';
import { setupEntities } from '@shared/testing';
import { DashboardUc } from './dashboard.uc';

const learnroomMock = (id: string, name: string) => {
	return {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
				isSynchronized: false,
			};
		},
	};
};

describe('dashboard uc', () => {
	let module: TestingModule;
	let service: DashboardUc;
	let repo: IDashboardRepo;
	let courseRepo: CourseRepo;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				DashboardUc,
				{
					provide: 'DASHBOARD_REPO',
					useValue: createMock<DashboardUc>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(DashboardUc);
		repo = module.get('DASHBOARD_REPO');
		courseRepo = module.get(CourseRepo);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUsersDashboard', () => {
		it('should return a dashboard', async () => {
			const spy = jest.spyOn(repo, 'getUsersDashboard').mockImplementation((userId: EntityId) => {
				const dashboard = new DashboardEntity('someid', { grid: [], userId });
				return Promise.resolve(dashboard);
			});
			jest.spyOn(courseRepo, 'findAllByUserId').mockImplementation(() => Promise.resolve([[], 0]));
			const dashboard = await service.getUsersDashboard('userId');

			expect(dashboard instanceof DashboardEntity).toEqual(true);
			expect(spy).toHaveBeenCalledWith('userId');
		});

		it('should synchronize which courses are on the board', async () => {
			const userId = 'userId';
			const dashboard = new DashboardEntity('someid', { grid: [], userId });
			const dashboardRepoSpy = jest
				.spyOn(repo, 'getUsersDashboard')
				.mockImplementation(() => Promise.resolve(dashboard));
			const courses = new Array(5).map(() => ({} as Course));
			const courseRepoSpy = jest
				.spyOn(courseRepo, 'findAllByUserId')
				.mockImplementation(() => Promise.resolve([courses, 5]));
			const syncSpy = jest.spyOn(dashboard, 'setLearnRooms');
			const persistSpy = jest.spyOn(repo, 'persistAndFlush');

			const result = await service.getUsersDashboard('userId');

			expect(result instanceof DashboardEntity).toEqual(true);
			expect(dashboardRepoSpy).toHaveBeenCalledWith('userId');
			expect(courseRepoSpy).toHaveBeenCalledWith(
				userId,
				{ onlyActiveCourses: true },
				{ order: { name: SortOrder.asc } }
			);
			expect(syncSpy).toHaveBeenCalledWith(courses);
			expect(persistSpy).toHaveBeenCalledWith(result);
		});
	});

	describe('moveElementOnDashboard', () => {
		it('should update position of existing element', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				const dashboard = new DashboardEntity(id, {
					grid: [
						{
							pos: { x: 1, y: 2 },
							gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
						},
					],
					userId: 'userId',
				});
				return Promise.resolve(dashboard);
			});
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			const resultGrid = result.getGrid();
			expect(resultGrid[0].pos).toEqual({ x: 2, y: 1 });
		});

		it('should persist the change', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				if (id === 'dashboardId')
					return Promise.resolve(
						new DashboardEntity(id, {
							grid: [
								{
									pos: { x: 1, y: 2 },
									gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
								},
							],
							userId: 'userId',
						})
					);
				throw new Error('not found');
			});
			const spy = jest.spyOn(repo, 'persistAndFlush');
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			expect(spy).toHaveBeenCalledWith(result);
		});

		it('should throw if userIds dont match', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) =>
				Promise.resolve(
					new DashboardEntity(id, {
						grid: [
							{
								pos: { x: 1, y: 2 },
								gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
							},
						],
						userId: 'differentId',
					})
				)
			);

			const callFut = () => service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			await expect(callFut).rejects.toThrow(NotFoundException);
		});
	});

	describe('renameGroupOnDashboard', () => {
		it('should update title of existing element', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				const dashboard = new DashboardEntity(id, {
					grid: [
						{
							pos: { x: 3, y: 4 },
							gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
								learnroomMock('referenceId1', 'Math'),
								learnroomMock('referenceId2', 'German'),
							]),
						},
					],
					userId: 'userId',
				});
				return Promise.resolve(dashboard);
			});
			const result = await service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			const gridElement = result.getElement({ x: 3, y: 4 });
			const resultTitle = gridElement.getContent().title;
			expect(resultTitle).toEqual('groupTitle');
		});

		it('should persist the change', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				if (id === 'dashboardId')
					return Promise.resolve(
						new DashboardEntity(id, {
							grid: [
								{
									pos: { x: 3, y: 4 },
									gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
										learnroomMock('referenceId1', 'Math'),
										learnroomMock('referenceId2', 'German'),
									]),
								},
							],
							userId: 'userId',
						})
					);
				throw new Error('not found');
			});
			const spy = jest.spyOn(repo, 'persistAndFlush');
			const result = await service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			expect(spy).toHaveBeenCalledWith(result);
		});

		it('should throw if userIds dont match', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) =>
				Promise.resolve(
					new DashboardEntity(id, {
						grid: [
							{
								pos: { x: 3, y: 4 },
								gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
									learnroomMock('referenceId1', 'Math'),
									learnroomMock('referenceId2', 'German'),
								]),
							},
						],
						userId: 'differentUserId',
					})
				)
			);

			const callFut = () => service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			await expect(callFut).rejects.toThrow(NotFoundException);
		});
	});
});
