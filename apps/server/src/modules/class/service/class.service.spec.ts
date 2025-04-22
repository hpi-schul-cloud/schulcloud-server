import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { Class } from '../domain';
import { classFactory } from '../domain/testing';
import { ClassEntity } from '../entity';
import { classEntityFactory } from '../entity/testing';
import { ClassesRepo } from '../repo';
import { ClassMapper } from '../repo/mapper';
import { ClassService } from './class.service';

describe(ClassService.name, () => {
	let module: TestingModule;
	let service: ClassService;
	let classesRepo: DeepMocked<ClassesRepo>;
	// let userDeletionInjectionService: UserDeletionInjectionService;

	beforeAll(async () => {
		await setupEntities([ClassEntity]);

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
				{
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();

		service = module.get(ClassService);
		classesRepo = module.get(ClassesRepo);
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

	describe('findById', () => {
		describe('when the user has classes', () => {
			const setup = () => {
				const clazz: Class = classFactory.build();

				classesRepo.findClassById.mockResolvedValueOnce(clazz);

				return {
					clazz,
				};
			};

			it('should return the class', async () => {
				const { clazz } = setup();

				const result: Class = await service.findById(clazz.id);

				expect(result).toEqual(clazz);
			});

			it('should throw error', async () => {
				classesRepo.findClassById.mockResolvedValueOnce(null);

				await expect(service.findById('someId')).rejects.toThrowError(NotFoundLoggableException);
			});
		});
	});

	describe('deleteUserData', () => {
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

				const mappedClasses = ClassMapper.mapToDOs([class1, class2]);

				classesRepo.findAllByUserId.mockResolvedValue(mappedClasses);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.CLASS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [class1.id, class2.id]),
				]);

				return {
					expectedResult,
					userId1: userId1.toHexString(),
				};
			};

			it('should call classesRepo.findAllByUserId', async () => {
				const { userId1 } = setup();
				await service.deleteUserData(userId1);

				expect(classesRepo.findAllByUserId).toBeCalledWith(userId1);
			});

			it('should call classesRepo.deleteUser', async () => {
				const { userId1 } = setup();
				await service.deleteUserData(userId1);

				expect(classesRepo.removeUserReference).toBeCalledWith(userId1);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResult, userId1 } = setup();

				const result = await service.deleteUserData(userId1);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('findClassWithSchoolIdAndExternalId', () => {
		describe('when searching for a class', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const externalId = new ObjectId().toHexString();

				classesRepo.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(null);

				return {
					schoolId,
					externalId,
				};
			};

			it('should call the repo', async () => {
				const { schoolId, externalId } = setup();

				const result = await service.findClassWithSchoolIdAndExternalId(schoolId, externalId);

				expect(result).toBeNull();
				expect(classesRepo.findClassWithSchoolIdAndExternalId).toHaveBeenCalledWith(schoolId, externalId);
			});
		});
	});

	describe('save', () => {
		describe('when saving classes', () => {
			const setup = () => {
				const classes = classFactory.buildList(3);

				return {
					classes,
				};
			};

			it('should call the repo', async () => {
				const { classes } = setup();

				await service.save(classes);

				expect(classesRepo.save).toHaveBeenCalledWith(classes);
			});
		});
	});
});
