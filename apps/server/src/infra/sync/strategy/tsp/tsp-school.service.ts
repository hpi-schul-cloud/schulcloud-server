import { FederalStateNames } from '@modules/legacy-school/types';
import { School, SchoolService } from '@modules/school';
import { FederalState, FederalStateService, FileStorageType, SchoolYearService } from '@modules/school/domain';
import { SchoolFactory } from '@modules/school/domain/factory';
import { SchoolFeature, SchoolPermissions } from '@modules/school/domain/type';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@modules/school/repo';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';

@Injectable()
export class TspSchoolService {
	private federalState: FederalState | undefined;

	constructor(
		private readonly schoolService: SchoolService,
		private readonly federalStateService: FederalStateService,
		private readonly schoolYearService: SchoolYearService
	) {}

	public async findSchool(system: System, identifier: string): Promise<School | undefined> {
		const schools = await this.schoolService.getSchools({
			externalId: identifier,
			systemId: system.id,
		});

		if (schools.length === 0) {
			return undefined;
		}
		return schools[0];
	}

	public async findAllSchoolsForSystem(system: System): Promise<School[]> {
		const schools = await this.schoolService.getSchools({
			systemId: system.id,
		});

		return schools;
	}

	public async updateSchool(school: School, name?: string): Promise<School> {
		if (!name) {
			return school;
		}

		school.name = name;

		const updatedSchool = await this.schoolService.save(school);

		return updatedSchool;
	}

	public async createSchool(system: System, identifier: string, name: string): Promise<School> {
		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
		const federalState = await this.findFederalState();

		const permissions: SchoolPermissions = {
			teacher: {
				STUDENT_LIST: true,
			},
		};

		const school = SchoolFactory.build({
			externalId: identifier,
			name,
			systemIds: [system.id],
			federalState,
			currentYear: schoolYear,
			features: new Set([SchoolFeature.OAUTH_PROVISIONING_ENABLED]),
			createdAt: new Date(),
			updatedAt: new Date(),
			id: new ObjectId().toHexString(),
			fileStorageType: FileStorageType.AWS_S3,
			permissions,
		});

		const savedSchool = await this.schoolService.save(school);

		return savedSchool;
	}

	private async findFederalState(): Promise<FederalState> {
		if (this.federalState) {
			return this.federalState;
		}

		const federalStateEntity = await this.federalStateService.findFederalStateByName(FederalStateNames.THUERINGEN);
		this.federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
		return this.federalState;
	}
}
