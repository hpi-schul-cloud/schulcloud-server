import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { FederalStateNames } from '@modules/legacy-school/types';
import { FederalStateService, SchoolFeature, SchoolYearService } from '@modules/school/domain';
import { FederalStateEntity, SchoolYearEntity } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalSchoolDto } from '../../../dto';
import { SchoolNameRequiredLoggableException } from '../../../loggable';

@Injectable()
export class SchulconnexSchoolProvisioningService {
	constructor(
		private readonly schoolService: LegacySchoolService,
		private readonly schoolYearService: SchoolYearService,
		private readonly federalStateService: FederalStateService
	) {}

	public async provisionExternalSchool(externalSchool: ExternalSchoolDto, systemId: EntityId): Promise<LegacySchoolDo> {
		const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
			externalSchool.externalId,
			systemId
		);
		let school: LegacySchoolDo;
		if (existingSchool) {
			school = existingSchool;
			school.name = this.getSchoolName(externalSchool);
			school.officialSchoolNumber = externalSchool.officialSchoolNumber ?? existingSchool.officialSchoolNumber;
			if (!school.systems) {
				school.systems = [systemId];
			} else if (!school.systems.includes(systemId)) {
				school.systems.push(systemId);
			}
		} else {
			const schoolYear: SchoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
			const federalState: FederalStateEntity = await this.federalStateService.findFederalStateByName(
				FederalStateNames.NIEDERSACHEN
			);

			school = new LegacySchoolDo({
				externalId: externalSchool.externalId,
				name: this.getSchoolName(externalSchool),
				officialSchoolNumber: externalSchool.officialSchoolNumber,
				systems: [systemId],
				features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
				schoolYear,
				federalState,
			});
		}

		const savedSchool: LegacySchoolDo = await this.schoolService.save(school, true);

		return savedSchool;
	}

	private getSchoolName(externalSchool: ExternalSchoolDto): string {
		if (!externalSchool.name) {
			throw new SchoolNameRequiredLoggableException('ExternalSchool.name');
		}

		const schoolName: string = externalSchool.location
			? `${externalSchool.name} (${externalSchool.location})`
			: externalSchool.name;

		return schoolName;
	}
}
