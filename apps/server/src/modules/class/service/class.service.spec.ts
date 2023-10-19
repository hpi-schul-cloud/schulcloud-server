import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { classEntityFactory } from '@src/modules/class/entity/testing/factory/class.entity.factory';
import { Class } from '../domain';
import { classFactory } from '../domain/testing/factory/class.factory';
import { ClassesRepo } from '../repo';
import { ClassMapper } from '../repo/mapper';
import { ClassService } from './class.service';

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

	describe('findClassesForSchool', () => {
		describe('when the school has classes', () => {
			const setup = () => {
				const schoolId: string = new ObjectId().toHexString();

				const classes: Class[] = classFactory.buildList(3);

				classesRepo.findAllBySchoolId.mockResolvedValueOnce(classes);

				return {
					schoolId,
					classes,
				};
			};

			it('should call the repo', async () => {
				const { schoolId } = setup();

				await service.findClassesForSchool(schoolId);

				expect(classesRepo.findAllBySchoolId).toHaveBeenCalledWith(schoolId);
			});

			it('should return the classes', async () => {
				const { schoolId, classes } = setup();

				const result: Class[] = await service.findClassesForSchool(schoolId);

				expect(result).toEqual(classes);
			});
		});
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
