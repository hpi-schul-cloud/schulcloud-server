import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { FileStorageType, School, SchoolService } from '@modules/school';
import { SchoolFeature, SchoolPermissions, SchoolYearService } from '@modules/school/domain';
import { SchoolFactory } from '@modules/school/domain/factory';
import { SchoolYearEntityMapper } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { ExternalSchoolDto, ProvisioningSystemDto } from '../dto';
import { SchoolNameRequiredLoggableException } from '../loggable';
import { ExternalIdMissingLoggableException } from '../loggable/external-id-missing.loggable-exception';

@Injectable()
export class ErwinProvisioningService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService,
		private readonly schoolYearService: SchoolYearService
	) {}

	public async provisionSchool(system: ProvisioningSystemDto, externalSchool: ExternalSchoolDto): Promise<School> {
		const schoolFoundByErwinId = await this.findSchoolByErwinId(externalSchool.erwinId);

		if (schoolFoundByErwinId) {
			return this.handleSchoolFoundByErwinId(schoolFoundByErwinId, externalSchool);
		}

		TypeGuard.requireKeys(
			externalSchool,
			['externalId'],
			new ExternalIdMissingLoggableException('External ID is missing', {
				erwinId: externalSchool.erwinId,
			})
		);

		const schoolFoundByExternalId = await this.findSchoolByExternalId(system.systemId, externalSchool.externalId);

		if (schoolFoundByExternalId) {
			return this.handleSchoolFoundByExternalId(schoolFoundByExternalId, externalSchool);
		}

		const newSchool = await this.createSchool(system.systemId, externalSchool);

		return newSchool;
	}

	private async findSchoolByErwinId(erwinId: string | undefined): Promise<School | null> {
		if (!erwinId) {
			return null;
		}

		const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (!erwinIdentifier || erwinIdentifier.type !== ReferencedEntityType.SCHOOL) {
			return null;
		}

		const school = await this.schoolService.getSchoolById(erwinIdentifier.referencedEntityId);
		return school;
	}

	private async handleSchoolFoundByErwinId(
		schoolFoundByErwinId: School,
		externalSchool: ExternalSchoolDto
	): Promise<School> {
		if (!externalSchool.externalId) {
			return schoolFoundByErwinId;
		}

		const updatedSchool = await this.updateSchool(schoolFoundByErwinId, externalSchool);
		return updatedSchool;
	}

	private async updateSchool(school: School, externalSchool: ExternalSchoolDto): Promise<School> {
		const externalSchoolName = this.formatSchoolName(externalSchool);

		if (externalSchoolName) {
			school.name = externalSchoolName;
		}

		if (externalSchool.officialSchoolNumber && !school.officialSchoolNumber) {
			school.updateOfficialSchoolNumber(externalSchool.officialSchoolNumber);
		}

		const updatedSchool = await this.schoolService.save(school);
		return updatedSchool;
	}

	private async findSchoolByExternalId(systemId: string, externalId: string): Promise<School | null> {
		const schools = await this.schoolService.getSchools({
			systemId,
			externalId,
		});

		if (schools.length === 0) {
			return null;
		}

		return schools[0];
	}

	private async handleSchoolFoundByExternalId(
		schoolFoundByExternalId: School,
		externalSchool: ExternalSchoolDto
	): Promise<School> {
		const updatedSchool = await this.updateSchool(schoolFoundByExternalId, externalSchool);

		if (externalSchool.erwinId) {
			await this.addErwinIdReference(updatedSchool.id, externalSchool.erwinId);
		}

		return updatedSchool;
	}

	private async createSchool(systemId: string, externalSchool: ExternalSchoolDto): Promise<School> {
		const schoolName = this.formatSchoolName(externalSchool);

		if (!schoolName) {
			throw new SchoolNameRequiredLoggableException('ExternalSchool.name');
		}

		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);

		const permissions: SchoolPermissions = {
			teacher: {
				STUDENT_LIST: true,
			},
		};

		const school = SchoolFactory.build({
			id: new ObjectId().toHexString(),
			externalId: externalSchool.externalId,
			name: schoolName,
			officialSchoolNumber: externalSchool.officialSchoolNumber,
			systemIds: [systemId],
			currentYear: schoolYear,
			features: new Set([SchoolFeature.OAUTH_PROVISIONING_ENABLED]),
			fileStorageType: FileStorageType.AWS_S3,
			permissions,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const savedSchool = await this.schoolService.save(school);

		if (externalSchool.erwinId) {
			await this.addErwinIdReference(savedSchool.id, externalSchool.erwinId);
		}

		return savedSchool;
	}

	private async addErwinIdReference(schoolId: string, erwinId: string): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: ReferencedEntityType.SCHOOL,
			referencedEntityId: schoolId,
		});
	}

	private formatSchoolName(externalSchool: ExternalSchoolDto): string | undefined {
		if (!externalSchool.name) {
			return undefined;
		}

		return externalSchool.location ? `${externalSchool.name} (${externalSchool.location})` : externalSchool.name;
	}
}
