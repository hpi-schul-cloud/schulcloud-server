import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityId } from '@shared/domain';
import { InternalServerErrorException } from '@nestjs/common';
import { classEntityFactory } from '@src/modules/class/entity/testing/factory/class.entity.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@shared/testing';
import { ClassService } from './class.service';
import { ClassesRepo } from '../repo';
import { ClassMapper } from '../repo/mapper';

describe(ClassService.name, () => {
	let module: TestingModule;
	let service: ClassService;
	let classesRepo: DeepMocked<ClassesRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ClassService,
				{
					provide: ClassesRepo,
					useValue: createMock<ClassesRepo>(),
				},
			],
		}).compile();

		service = module.get(ClassService);
		classesRepo = module.get(ClassesRepo);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteUserDataFromClasses', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const userId = undefined as unknown as EntityId;

				return {
					userId,
				};
			};

			it('should throw and error', async () => {
				const { userId } = setup();

				await expect(service.deleteUserDataFromClasses(userId)).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when deleting by userId', () => {
			const setup = () => {
				const userId1 = new ObjectId();
				const userId2 = new ObjectId();
				const userId3 = new ObjectId();
				const class1 = classEntityFactory.withUserIds([userId1, userId2]).build();
				const class2 = classEntityFactory.withUserIds([userId1, userId3]).build();
				classEntityFactory.withUserIds([userId2, userId3]).build();

				const mappedClasses = ClassMapper.mapToDOs([class1, class2]);

				classesRepo.findAllByUserId.mockResolvedValue(mappedClasses);

				return {
					userId1,
				};
			};

			it('should call classesRepo.findAllByUserId', async () => {
				const { userId1 } = setup();
				await service.deleteUserDataFromClasses(userId1.toHexString());

				expect(classesRepo.findAllByUserId).toBeCalledWith(userId1.toHexString());
			});

			it('should update classes without updated user', async () => {
				const { userId1 } = setup();

				const result = await service.deleteUserDataFromClasses(userId1.toHexString());

				expect(result).toEqual(2);
			});
		});
	});
});
