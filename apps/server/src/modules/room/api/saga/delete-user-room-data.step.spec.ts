import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoomArrangementService } from '@modules/room/domain';
import { roomArrangementEntityFactory, roomEntityFactory } from '@modules/room/testing';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { SagaRegistryService, SagaStepRegistryService } from '@modules/saga/service';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomArrangementEntity, RoomArrangementRepo, RoomEntity } from '../../repo';
import { DeleteUserRoomDataStep } from './delete-user-room-data.step';

describe(DeleteUserRoomDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserRoomDataStep;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User, RoomEntity, RoomArrangementEntity] })],
			providers: [
				DeleteUserRoomDataStep,
				SagaService,
				SagaRegistryService,
				SagaStepRegistryService,
				RoomArrangementService,
				RoomArrangementRepo,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserRoomDataStep);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserRoomDataStep(sagaService, createMock<RoomArrangementService>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.ROOM, step);
		});
	});

	describe('execute', () => {
		describe('when user has a room arrangement', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const rooms = roomEntityFactory.buildListWithId(2);
				const roomArrangement = roomArrangementEntityFactory.build({
					userId: user.id,
					items: rooms.map((r) => {
						return {
							id: r.id,
						};
					}),
				});

				await em.persist([user, ...rooms, roomArrangement]).flush();
				em.clear();

				return {
					user,
					roomArrangement,
				};
			};

			it('should delete the arrangement', async () => {
				const { user, roomArrangement } = await setup();

				await step.execute({ userId: user.id });

				await expect(em.findOneOrFail(RoomArrangementEntity, { id: roomArrangement.id })).rejects.toThrow(
					NotFoundError
				);
			});

			it('should return report with 1 deleted arrangement', async () => {
				const { user, roomArrangement } = await setup();

				const result = await step.execute({ userId: user.id });

				const expectedResultWithDeletedRoomArrangement = StepReportBuilder.build(ModuleName.ROOM, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [roomArrangement.id]),
				]);

				expect(result).toEqual(expectedResultWithDeletedRoomArrangement);
			});
		});

		describe('when user has a room arrangement with groups', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const rooms = roomEntityFactory.buildListWithId(2);
				const roomArrangement = roomArrangementEntityFactory.build({
					userId: user.id,
					schemaVersion: 2,
					revision: 4,
					ungroupedRoomIds: [rooms[0].id],
					groups: [{ id: new ObjectId().toHexString(), name: 'Informatik', collapsed: true, roomIds: [rooms[1].id] }],
					confirmGroupDeletion: false,
					items: rooms.map((room) => {
						return { id: room.id };
					}),
				});

				await em.persist([user, ...rooms, roomArrangement]).flush();
				em.clear();

				return { user, rooms, roomArrangement };
			};

			it('should delete the whole arrangement including its groups but keep the rooms', async () => {
				const { user, rooms, roomArrangement } = await setup();

				const result = await step.execute({ userId: user.id });

				expect(result).toEqual(
					StepReportBuilder.build(ModuleName.ROOM, [
						StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [roomArrangement.id]),
					])
				);
				const storedArrangements = await em
					.getCollection(RoomArrangementEntity.name)
					.find({ user: new ObjectId(user.id) })
					.toArray();
				expect(storedArrangements).toEqual([]);
				expect(await em.count(RoomEntity, { id: { $in: rooms.map((room) => room.id) } })).toBe(2);
			});
		});

		describe('when user has no room arrangement', () => {
			const setup = async () => {
				const user = userFactory.build();
				const rooms = roomEntityFactory.buildList(2);

				await em.persist([user, ...rooms]).flush();
				em.clear();

				return {
					user,
				};
			};

			it('should return report with 0 deleted arrangements', async () => {
				const { user } = await setup();

				const result = await step.execute({ userId: user.id });

				const expectedResultWithDeletedRoomArrangement = StepReportBuilder.build(ModuleName.ROOM, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
				]);

				expect(result).toEqual(expectedResultWithDeletedRoomArrangement);
			});
		});

		describe('when user has more than one room arrangements', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const roomArrangements = roomArrangementEntityFactory.buildList(2, {
					userId: user.id,
				});

				await em.persist([user, ...roomArrangements]).flush();
				em.clear();

				return {
					user,
					roomArrangement1: roomArrangements[0],
					roomArrangement2: roomArrangements[1],
				};
			};

			it('should delete all arrangements', async () => {
				const { user, roomArrangement1, roomArrangement2 } = await setup();

				await step.execute({ userId: user.id });

				await expect(em.findOneOrFail(RoomArrangementEntity, { id: roomArrangement1.id })).rejects.toThrow(
					NotFoundError
				);
				await expect(em.findOneOrFail(RoomArrangementEntity, { id: roomArrangement2.id })).rejects.toThrow(
					NotFoundError
				);
			});

			it('should return report with all deleted arrangements', async () => {
				const { user, roomArrangement1, roomArrangement2 } = await setup();

				const result = await step.execute({ userId: user.id });

				const expectedResultWithDeletedRoomArrangement = StepReportBuilder.build(ModuleName.ROOM, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 2, [roomArrangement1.id, roomArrangement2.id]),
				]);

				expect(result).toEqual(expectedResultWithDeletedRoomArrangement);
			});
		});
	});
});
