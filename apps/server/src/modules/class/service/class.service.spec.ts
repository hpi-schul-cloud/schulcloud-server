import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { Class } from '../domain';
import { classFactory } from '../domain/testing';
import { ClassEntity } from '../entity';
import { ClassesRepo, ClassScope } from '../repo';
import { ClassService } from './class.service';

describe(ClassService.name, () => {
	let module: TestingModule;
	let service: ClassService;
	let classesRepo: DeepMocked<ClassesRepo>;

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

	describe('find', () => {
		describe('when the school has classes', () => {
			const setup = () => {
				const scope = new ClassScope();
				const classes: Class[] = classFactory.buildList(3);

				classesRepo.find.mockResolvedValueOnce(classes);

				return {
					classes,
					scope,
				};
			};

			it('should call the repo', async () => {
				const { scope } = setup();

				await service.find(scope);

				expect(classesRepo.find).toHaveBeenCalledWith(scope);
			});

			it('should return the classes', async () => {
				const { scope, classes } = setup();

				const result: Class[] = await service.find(scope);

				expect(result).toEqual(classes);
			});
		});
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

	describe('findExistingClassesByIds', () => {
		describe('when the user has classes', () => {
			const setup = () => {
				const [clazzOne, clazzTwo]: Class[] = classFactory.buildList(2);

				return {
					clazzOne,
					clazzTwo,
				};
			};

			it('should return the classes as array', async () => {
				const { clazzOne, clazzTwo } = setup();
				classesRepo.findClassById.mockResolvedValueOnce(clazzOne);
				classesRepo.findClassById.mockResolvedValueOnce(clazzTwo);

				const result: Class[] = await service.findExistingClassesByIds([clazzOne.id, clazzTwo.id]);

				expect(result).toEqual([clazzOne, clazzTwo]);
			});

			it('should return empty array if classes not found', async () => {
				const { clazzOne, clazzTwo } = setup();
				classesRepo.findClassById.mockResolvedValueOnce(null);
				classesRepo.findClassById.mockResolvedValueOnce(null);

				const result: Class[] = await service.findExistingClassesByIds([clazzOne.id, clazzTwo.id]);

				expect(result).toEqual([]);
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
