import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { FederalStateService, LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { SchoolFeature } from '@shared/domain/types';
import { federalStateFactory, legacySchoolDoFactory, schoolYearFactory } from '@shared/testing';
import { ExternalSchoolDto } from '../../../dto';
import { SchulconnexSchoolProvisioningService } from './schulconnex-school-provisioning.service';

describe(SchulconnexSchoolProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexSchoolProvisioningService;

	let schoolService: DeepMocked<LegacySchoolService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let federalStateService: DeepMocked<FederalStateService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexSchoolProvisioningService,
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
				{
					provide: FederalStateService,
					useValue: createMock<FederalStateService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexSchoolProvisioningService);
		schoolService = module.get(LegacySchoolService);
		schoolYearService = module.get(SchoolYearService);
		federalStateService = module.get(FederalStateService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalSchool', () => {
		describe('when systemId is given and external school does not exist', () => {
			describe('when successful', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should save the correct data', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});

				it('should save the new school', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(result).toEqual(savedSchoolDO);
				});
			});

			describe('when the external system provides a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						location: 'Hannover',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name (Hannover)',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should append it to the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});
			});

			describe('when the external system does not provide a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should only use the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});
			});
		});

		describe('when external school already exists', () => {
			describe('when successful', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should update the existing school', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(result).toEqual(savedSchoolDO);
				});
			});

			describe('when the external system provides a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						location: 'Hannover',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name (Hannover)',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should append it to the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});

			describe('when the external system does not provide a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should only use the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});

			describe('when there is a system at the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const otherSystemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [otherSystemId, systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [otherSystemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						otherSystemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should append the new system', async () => {
					const { systemId, otherSystemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(
						{
							...savedSchoolDO,
							systems: [otherSystemId, systemId],
						},
						true
					);
				});
			});

			describe('when there is no system at the school yet', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: undefined,
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should create a new system list', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});
		});
	});
});
