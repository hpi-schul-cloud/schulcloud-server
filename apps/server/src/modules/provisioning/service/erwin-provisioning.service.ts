import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { School, SchoolService } from '@modules/school';
import { FileStorageType, SchoolYearService } from '@modules/school/domain';
import { SchoolFactory } from '@modules/school/domain/factory';
import { SchoolFeature, SchoolPermissions } from '@modules/school/domain/type';
import { SchoolYearEntityMapper } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';
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
		// 1. Prüfen: Kann die Schule über erwinId gefunden werden?
		if (externalSchool.erwinId) {
			const schoolFoundByErwinId = await this.findSchoolByErwinId(externalSchool.erwinId);

			if (schoolFoundByErwinId) {
				// Wenn externalId fehlt → lokale Schule nicht überschreiben, Schule einfach zurückgeben
				if (!externalSchool.externalId) {
					return schoolFoundByErwinId;
				}

				// Wenn externalId vorhanden → update School
				const updatedSchool = await this.updateSchool(schoolFoundByErwinId, externalSchool);
				return updatedSchool;
			}
		}

		// 2. Wenn Schule nicht per erwinId gefunden wird -> Prüfen, ob externalId existiert
		if (!externalSchool.externalId) {
			throw new ExternalIdMissingLoggableException('ExternalSchoolDto.externalId', {
				erwinId: externalSchool.erwinId,
			});
		}

		// Schule über externalId im SVS suchen
		const schoolFoundByExternalId = await this.findSchoolByExternalId(system.systemId, externalSchool.externalId);

		// 3. Wenn Schule über externalId gefunden wird:
		if (schoolFoundByExternalId) {
			const updatedSchool = await this.updateSchool(schoolFoundByExternalId, externalSchool);

			// erwinId Referenz hinzufügen (nicht die SystemId!)
			if (externalSchool.erwinId) {
				await this.addErwinIdReference(updatedSchool.id, externalSchool.erwinId);
			}

			return updatedSchool;
		}

		// 4. Wenn Schule nicht gefunden wird ->Neue Schule im SVS anlegen
		const newSchool = await this.createSchool(system.systemId, externalSchool);

		// erwinId Referenz hinzufügen
		if (externalSchool.erwinId) {
			await this.addErwinIdReference(newSchool.id, externalSchool.erwinId);
		}

		return newSchool;
	}

	private async findSchoolByErwinId(erwinId: string): Promise<School | null> {
		const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (!erwinIdentifier || erwinIdentifier.type !== ReferencedEntityType.SCHOOL) {
			return null;
		}

		const school = await this.schoolService.getSchoolById(erwinIdentifier.referencedEntityId);
		return school;
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

	private async updateSchool(school: School, externalSchool: ExternalSchoolDto): Promise<School> {
		const schoolName = this.getSchoolName(externalSchool);

		if (schoolName) {
			school.name = schoolName;
		}

		if (externalSchool.officialSchoolNumber && !school.officialSchoolNumber) {
			school.updateOfficialSchoolNumber(externalSchool.officialSchoolNumber);
		}

		// WICHTIG: SystemId wird NICHT automatisch gesetzt oder überschrieben!

		const updatedSchool = await this.schoolService.save(school);
		return updatedSchool;
	}

	private async createSchool(systemId: string, externalSchool: ExternalSchoolDto): Promise<School> {
		const schoolName = this.getSchoolName(externalSchool);

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

	private getSchoolName(externalSchool: ExternalSchoolDto): string | undefined {
		if (!externalSchool.name) {
			return undefined;
		}

		return externalSchool.location ? `${externalSchool.name} (${externalSchool.location})` : externalSchool.name;
	}
}
