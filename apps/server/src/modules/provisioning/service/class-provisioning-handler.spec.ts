import { faker } from '@faker-js/faker';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Class, ClassFactory, ClassService } from '@modules/class';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { erwinIdentifierFactoryWithSchool } from '@modules/erwin-identifier/testing';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { ExternalClassDto, type ExternalSchoolDto, type ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException } from '../loggable';
import { externalClassDtoFactory, externalSchoolDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ClassProvisioningHandler } from './class-provisioning-handler';
import { type ProvisioningContext } from './erwin-provisioning-handler.interface';

describe('ClassProvisioningHandler', () => {
	let module: TestingModule;
	let sut: ClassProvisioningHandler;
	let classServiceMock: DeepMocked<ClassService>;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ClassProvisioningHandler,
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: ErwinIdentifierService,
					useValue: createMock<ErwinIdentifierService>(),
				},
			],
		}).compile();

		sut = module.get(ClassProvisioningHandler);
		classServiceMock = module.get(ClassService);
		schoolServiceMock = module.get(SchoolService);
		erwinIdentifierServiceMock = module.get(ErwinIdentifierService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	it('should have correct referencedEntityType', () => {
		expect(sut.referencedEntityType).toBe(ReferencedEntityType.CLASS);
	});

	it('should have correct dtoName', () => {
		expect(sut.dtoName).toBe('ExternalClassDto');
	});

	describe('validate', () => {
		describe('when externalClass and externalSchool are provided', () => {
			const setup = () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalClass: externalClassDtoFactory.build(),
				};

				return { context };
			};

			it('should not throw', () => {
				const { context } = setup();

				expect(() => sut.validate(context)).not.toThrow();
			});
		});

		describe('when externalClass is not provided', () => {
			const setup = () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				};

				return { context };
			};

			it('should throw BadDataLoggableException', () => {
				const { context } = setup();

				expect(() => sut.validate(context)).toThrow(BadDataLoggableException);
			});
		});

		describe('when externalSchool is not provided', () => {
			const setup = () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalClass: externalClassDtoFactory.build(),
				};

				return { context };
			};

			it('should throw BadDataLoggableException', () => {
				const { context } = setup();

				expect(() => sut.validate(context)).toThrow(BadDataLoggableException);
			});
		});
	});

	describe('getExternalData', () => {
		const setup = () => {
			const externalClass = externalClassDtoFactory.build();
			const context: ProvisioningContext = {
				system: provisioningSystemDtoFactory.build(),
				externalSchool: externalSchoolDtoFactory.build(),
				externalClass,
			};

			return { context, externalClass };
		};

		it('should return externalClass', () => {
			const { context, externalClass } = setup();

			const result = sut.getExternalData(context);

			expect(result).toBe(externalClass);
		});
	});

	describe('getErwinId', () => {
		describe('when externalClass has erwinId', () => {
			const setup = () => {
				const erwinId = new ObjectId().toHexString();
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalClass: externalClassDtoFactory.build({ erwinId }),
				};

				return { context, erwinId };
			};

			it('should return erwinId', () => {
				const { context, erwinId } = setup();

				const result = sut.getErwinId(context);

				expect(result).toBe(erwinId);
			});
		});

		describe('when externalClass has no erwinId', () => {
			const setup = () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalClass: externalClassDtoFactory.build({ erwinId: undefined }),
				};

				return { context };
			};

			it('should return undefined', () => {
				const { context } = setup();

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});

		describe('when externalClass is not provided', () => {
			const setup = () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				};

				return { context };
			};

			it('should return undefined', () => {
				const { context } = setup();

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('findByEntityId', () => {
		const setup = () => {
			const entityId = new ObjectId().toHexString();
			const classEntity = ClassFactory.create();
			classServiceMock.findById.mockResolvedValueOnce(classEntity);

			return { entityId, classEntity };
		};

		it('should call classService.findById', async () => {
			const { entityId, classEntity } = setup();

			const result = await sut.findByEntityId(entityId);

			expect(classServiceMock.findById).toHaveBeenCalledWith(entityId);
			expect(result).toBe(classEntity);
		});
	});

	describe('findByExternalId', () => {
		const setup = () => {
			const school = schoolFactory.build();
			const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
			const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
				externalId: school.externalId,
			});
			const externalClass: ExternalClassDto = externalClassDtoFactory.build();
			const context: ProvisioningContext = { system, externalSchool, externalClass };
			const classEntity = ClassFactory.create({ schoolId: school.id });

			schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
			classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(classEntity);

			return { context, system, externalSchool, externalClass, school, classEntity };
		};

		describe('when class is found', () => {
			it('should return the class', async () => {
				const { context, system, externalSchool, externalClass, school, classEntity } = setup();

				const result = await sut.findByExternalId(context);

				expect(schoolServiceMock.getSchools).toHaveBeenCalledWith({
					systemId: system.systemId,
					externalId: externalSchool.externalId,
				});
				expect(classServiceMock.findClassWithSchoolIdAndExternalId).toHaveBeenCalledWith(
					school.id,
					externalClass.externalId
				);
				expect(result).toBe(classEntity);
			});
		});

		describe('when school is not found', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalClass: ExternalClassDto = externalClassDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				return { context };
			};

			it('should return null', async () => {
				const { context } = setup();

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
				expect(classServiceMock.findClassWithSchoolIdAndExternalId).not.toHaveBeenCalled();
			});
		});

		describe('when no class is found', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalClass: ExternalClassDto = externalClassDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(null);

				return { context };
			};

			it('should return null', async () => {
				const { context } = setup();

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
			});
		});
	});

	describe('create', () => {
		describe('when creating a new class', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalClass: ExternalClassDto = externalClassDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					name: faker.company.name(),
					gradeLevel: 5,
				});
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				classServiceMock.save.mockResolvedValueOnce();
				erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
				erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
					erwinIdentifierFactoryWithSchool.build()
				);

				return { context, externalClass, school };
			};

			it('should return created class', async () => {
				const { context, externalClass, school } = setup();

				const result = await sut.create(context);

				expect(result).toBeInstanceOf(Class);
				expect(result.name).toBe(externalClass.name);
				expect(result.gradeLevel).toBe(externalClass.gradeLevel);
				expect(result.schoolId).toBe(school.id);
			});

			it('should save class with correct properties', async () => {
				const { context, externalClass, school } = setup();

				await sut.create(context);

				expect(classServiceMock.save).toHaveBeenCalled();
				const savedClass = classServiceMock.save.mock.calls[0][0] as Class;
				expect(savedClass.name).toBe(externalClass.name);
				expect(savedClass.gradeLevel).toBe(externalClass.gradeLevel);
				expect(savedClass.schoolId).toBe(school.id);
				expect(savedClass.sourceOptions).toBeDefined();
			});

			it('should create erwin identifier', async () => {
				const { context, externalClass } = setup();

				const result = await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
					erwinId: externalClass.erwinId,
					type: ReferencedEntityType.CLASS,
					referencedEntityId: result.id,
				});
			});
		});

		describe('when school is not found', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalClass: ExternalClassDto = externalClassDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				return { context };
			};

			it('should throw BadDataLoggableException', async () => {
				const { context } = setup();

				await expect(sut.create(context)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when creating a class without erwinId', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalClass: ExternalClassDto = externalClassDtoFactory.build({
					erwinId: undefined,
					name: faker.company.name(),
				});
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				classServiceMock.save.mockResolvedValueOnce();

				return { context };
			};

			it('should not create erwin identifier', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});

		describe('when creating a class without name', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalClass: ExternalClassDto = new ExternalClassDto({
					externalId: new ObjectId().toHexString(),
					name: undefined,
				});
				const context: ProvisioningContext = { system, externalSchool, externalClass };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				classServiceMock.save.mockResolvedValueOnce();

				return { context };
			};

			it('should create class with empty name', async () => {
				const { context } = setup();

				const result = await sut.create(context);

				expect(result.name).toBe('');
			});
		});

		describe('when erwin identifier already exists', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalClass: ExternalClassDto = externalClassDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					name: faker.company.name(),
				});
				const context: ProvisioningContext = { system, externalSchool, externalClass };
				const existingIdentifier = erwinIdentifierFactoryWithSchool.build();

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				classServiceMock.save.mockResolvedValueOnce();
				erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(existingIdentifier);

				return { context };
			};

			it('should not create duplicate erwin identifier', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});
	});

	describe('update', () => {
		describe('when updating a class', () => {
			const setup = () => {
				const classEntity = ClassFactory.create();
				const externalClass: ExternalClassDto = externalClassDtoFactory.build({
					name: faker.company.name(),
					gradeLevel: 7,
				});

				classServiceMock.save.mockResolvedValueOnce();

				return { classEntity, externalClass };
			};

			it('should return updated class', async () => {
				const { classEntity, externalClass } = setup();

				const result = await sut.update(classEntity, externalClass);

				expect(result).toBe(classEntity);
			});

			it('should update class name', async () => {
				const { classEntity, externalClass } = setup();

				await sut.update(classEntity, externalClass);

				expect(classEntity.name).toBe(externalClass.name);
			});

			it('should update class gradeLevel', async () => {
				const { classEntity, externalClass } = setup();

				await sut.update(classEntity, externalClass);

				expect(classEntity.gradeLevel).toBe(externalClass.gradeLevel);
			});

			it('should save class', async () => {
				const { classEntity, externalClass } = setup();

				await sut.update(classEntity, externalClass);

				expect(classServiceMock.save).toHaveBeenCalledWith(classEntity);
			});
		});

		describe('when externalClass has no name', () => {
			const setup = () => {
				const originalName = faker.company.name();
				const classEntity = ClassFactory.create({ name: originalName });
				const externalClass: ExternalClassDto = new ExternalClassDto({
					externalId: new ObjectId().toHexString(),
					name: undefined,
				});
				classServiceMock.save.mockResolvedValueOnce();

				return { classEntity, externalClass, originalName };
			};

			it('should not update class name', async () => {
				const { classEntity, externalClass, originalName } = setup();

				await sut.update(classEntity, externalClass);

				expect(classEntity.name).toBe(originalName);
			});
		});

		describe('when externalClass has no gradeLevel', () => {
			const setup = () => {
				const originalGradeLevel = 5;
				const classEntity = ClassFactory.create({ gradeLevel: originalGradeLevel });
				const externalClass: ExternalClassDto = new ExternalClassDto({
					externalId: new ObjectId().toHexString(),
					gradeLevel: undefined,
				});
				classServiceMock.save.mockResolvedValueOnce();

				return { classEntity, externalClass, originalGradeLevel };
			};

			it('should not update class gradeLevel', async () => {
				const { classEntity, externalClass, originalGradeLevel } = setup();

				await sut.update(classEntity, externalClass);

				expect(classEntity.gradeLevel).toBe(originalGradeLevel);
			});
		});

		describe('when externalClass has gradeLevel 0', () => {
			const setup = () => {
				const classEntity = ClassFactory.create({ gradeLevel: 5 });
				const externalClass: ExternalClassDto = new ExternalClassDto({
					externalId: new ObjectId().toHexString(),
					gradeLevel: 0,
				});
				classServiceMock.save.mockResolvedValueOnce();

				return { classEntity, externalClass };
			};

			it('should update class gradeLevel to 0', async () => {
				const { classEntity, externalClass } = setup();

				await sut.update(classEntity, externalClass);

				expect(classEntity.gradeLevel).toBe(0);
			});
		});
	});
});
