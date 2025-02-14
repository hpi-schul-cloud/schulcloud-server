import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { Synchronization } from '..';
import { SynchronizationEntity, SynchronizationRepo } from '../../repo';
import { synchronizationFactory } from '../testing';
import { SynchronizationService } from './synchronization.service';

describe(SynchronizationService.name, () => {
	let module: TestingModule;
	let service: SynchronizationService;
	let repo: DeepMocked<SynchronizationRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SynchronizationService,
				{
					provide: SynchronizationRepo,
					useValue: createMock<SynchronizationRepo>(),
				},
			],
		}).compile();

		service = module.get(SynchronizationService);
		repo = module.get(SynchronizationRepo);

		await setupEntities([SynchronizationEntity]);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('should be defined', () => {
			expect(service).toBeDefined();
		});
	});

	describe('createSynchronization', () => {
		describe('when creating a synchronization', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();

				return { systemId };
			};

			it('should call synchronizationRepo.create', async () => {
				const { systemId } = setup();

				await service.createSynchronization(systemId);

				expect(repo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
					})
				);
			});
		});
	});

	describe('findById', () => {
		describe('when finding synchronization', () => {
			const setup = () => {
				const synchronizationId = new ObjectId().toHexString();
				const synchronization = new Synchronization({ id: synchronizationId });

				repo.findById.mockResolvedValueOnce(synchronization);

				return { synchronizationId, synchronization };
			};

			it('should call synchronizationRepo.findById', async () => {
				const { synchronizationId } = setup();
				await service.findById(synchronizationId);

				expect(repo.findById).toBeCalledWith(synchronizationId);
			});

			it('should return synchronization', async () => {
				const { synchronizationId, synchronization } = setup();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const result = await service.findById(synchronizationId);

				expect(result).toEqual(synchronization);
			});
		});
	});

	describe('update', () => {
		describe('when updating synchronization', () => {
			const setup = () => {
				const synchronization = synchronizationFactory.buildWithId();

				return { synchronization };
			};

			it('should call synchronizationRepo.update', async () => {
				const { synchronization } = setup();

				await service.update(synchronization);

				expect(repo.update).toBeCalledWith(synchronization);
			});
		});
	});
});
