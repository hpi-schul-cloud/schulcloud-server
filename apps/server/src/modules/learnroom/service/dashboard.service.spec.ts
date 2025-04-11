import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { DashboardService } from '.';
import { Dashboard, GridElement } from '../domain/do/dashboard';
import { DashboardElementRepo } from '../repo';
import { DASHBOARD_REPO, IDashboardRepo } from '../repo/mikro-orm/dashboard.repo';

describe(DashboardService.name, () => {
	let module: TestingModule;
	let dashboardRepo: IDashboardRepo;
	let dashboardElementRepo: DeepMocked<DashboardElementRepo>;
	let dashboardService: DeepMocked<DashboardService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities([User]);
		module = await Test.createTestingModule({
			providers: [
				DashboardService,
				{
					provide: DASHBOARD_REPO,
					useValue: createMock<DashboardService>(),
				},
				{
					provide: DashboardElementRepo,
					useValue: createMock<DashboardElementRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();
		dashboardService = module.get(DashboardService);
		dashboardRepo = module.get(DASHBOARD_REPO);
		dashboardElementRepo = module.get(DashboardElementRepo);
		eventBus = module.get(EventBus);

		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when deleting dashboard by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const dashboardId = new ObjectId().toHexString();
			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							'elementId',
							courseEntityFactory.buildWithId({ name: 'Mathe' })
						),
					},
				],
				userId: user.id,
			});

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.DASHBOARD, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [dashboardId]),
			]);

			return { dashboard, expectedResult, user };
		};

		describe('when dashboard exist', () => {
			it('should call dashboardRepo.getUsersDashboardIfExist', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should call dashboardElementRepo.deleteByDashboardId', async () => {
				const { dashboard, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				const spy = jest.spyOn(dashboardElementRepo, 'deleteByDashboardId');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(dashboard.id);
			});

			it('should call dashboardRepo.deleteDashboardByUserId', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'deleteDashboardByUserId');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should delete users dashboard', async () => {
				const { dashboard, expectedResult, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				jest.spyOn(dashboardRepo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

				const result = await dashboardService.deleteUserData(user.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in dashboardService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(dashboardService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await dashboardService.handle({ deletionRequestId, targetRefId });

				expect(dashboardService.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(dashboardService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await dashboardService.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
