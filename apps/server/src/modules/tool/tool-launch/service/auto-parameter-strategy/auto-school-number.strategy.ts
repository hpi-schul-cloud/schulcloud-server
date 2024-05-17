import { LegacySchoolService } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoSchoolNumberStrategy implements AutoParameterStrategy {
	constructor(private readonly schoolService: LegacySchoolService) {}

	async getValue(
		schoolExternalTool: SchoolExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		return school.officialSchoolNumber;
	}
}
