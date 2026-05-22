import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import {
	FileStorageType,
	School,
	SchoolFactory,
	SchoolFeature,
	SchoolPermissions,
	SchoolService,
	SchoolYearEntityMapper,
	SchoolYearService,
} from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ExternalSchoolDto } from '../dto';
import { BadDataLoggableException, SchoolNameRequiredLoggableException } from '../loggable';
import {
	ExternalEntityData,
	ProvisioningContext,
	ProvisioningEntityHandler,
	ProvisioningResult,
} from './erwin-provisioning-handler.interface';

@Injectable()
export class SchoolProvisioningHandler implements ProvisioningEntityHandler {
	public readonly referencedEntityType = ReferencedEntityType.SCHOOL;

	public readonly dtoName = ExternalSchoolDto.name;

	constructor(
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService,
		private readonly schoolYearService: SchoolYearService
	) {}

	public validate(context: ProvisioningContext): void {
		if (!context.externalSchool) {
			throw new BadDataLoggableException('ExternalSchoolDto is required for SCHOOL provisioning');
		}
	}

	public getExternalData(context: ProvisioningContext): ExternalEntityData {
		return context.externalSchool as ExternalSchoolDto;
	}

	public getErwinId(context: ProvisioningContext): string | undefined {
		return context.externalSchool?.erwinId;
	}

	public async findByEntityId(entityId: string): Promise<ProvisioningResult | null> {
		return this.schoolService.getSchoolById(entityId);
	}

	public async findByExternalId(context: ProvisioningContext): Promise<School | null> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schools = await this.schoolService.getSchools({
			systemId: context.system.systemId,
			externalId: externalSchool.externalId,
		});

		return schools.length > 0 ? schools[0] : null;
	}

	public async create(context: ProvisioningContext): Promise<School> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
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
			systemIds: [context.system.systemId],
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

	public async update(entity: ProvisioningResult, data: ExternalEntityData): Promise<School> {
		const school = entity as School;
		const externalSchool = data as ExternalSchoolDto;
		const externalSchoolName = this.formatSchoolName(externalSchool);

		if (externalSchoolName) {
			school.name = externalSchoolName;
		}

		if (externalSchool.officialSchoolNumber && !school.officialSchoolNumber) {
			school.updateOfficialSchoolNumber(externalSchool.officialSchoolNumber);
		}

		return this.schoolService.save(school);
	}

	private formatSchoolName(externalSchool: ExternalSchoolDto): string | undefined {
		if (!externalSchool.name) {
			return undefined;
		}

		return externalSchool.location ? `${externalSchool.name} (${externalSchool.location})` : externalSchool.name;
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
}
