import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement } from '@shared/domain/entity';
import { LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { DashboardElementRepo, IDashboardRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { DashboardService } from '.';

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

describe(DashboardService.name, () => {
	let module: TestingModule;
	let userRepo: DeepMocked<UserRepo>;
	let dashboardRepo: IDashboardRepo;
	let dashboardElementRepo: DeepMocked<DashboardElementRepo>;
	let dashboardService: DeepMocked<DashboardService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				DashboardService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: 'DASHBOARD_REPO',
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
		userRepo = module.get(UserRepo);
		dashboardRepo = module.get('DASHBOARD_REPO');
		dashboardElementRepo = module.get(DashboardElementRepo);
		eventBus = module.get(EventBus);
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
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
					},
				],
				userId: user.id,
			});
			userRepo.findById.mockResolvedValue(user);

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
