import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Class } from '../domain';
import { classFactory } from '../domain/testing';
import { classEntityFactory } from '../entity/testing';
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('findAllByUserId', () => {
		describe('when the user has classes', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();

				const classes: Class[] = classFactory.buildList(3);

				classesRepo.findAllByUserId.mockResolvedValueOnce(classes);

				return {
					userId,
					classes,
				};
			};

			it('should return the classes', async () => {
				const { userId, classes } = setup();

				const result: Class[] = await service.findAllByUserId(userId);

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

				await expect(service.deleteUserData(userId)).rejects.toThrowError(InternalServerErrorException);
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

				const expectedResult = DomainOperationBuilder.build(DomainName.CLASS, OperationType.UPDATE, 2, [
					class1.id,
					class2.id,
				]);

				return {
					expectedResult,
					userId1,
				};
			};

			it('should call classesRepo.findAllByUserId', async () => {
				const { userId1 } = setup();
				await service.deleteUserData(userId1.toHexString());

				expect(classesRepo.findAllByUserId).toBeCalledWith(userId1.toHexString());
			});

			it('should update classes without updated user', async () => {
				const { expectedResult, userId1 } = setup();

				const result = await service.deleteUserData(userId1.toHexString());

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
