import { Injectable } from '@nestjs/common';
import { SchoolExternalTool, SchoolExternalToolProps } from '../domain';
import { SchoolExternalToolService } from '../service';

@Injectable()
export class AdminApiSchoolExternalToolUc {
	constructor(private readonly schoolExternalToolService: SchoolExternalToolService) {}

	async createSchoolExternalTool(schoolExternalToolProps: SchoolExternalToolProps): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool(schoolExternalToolProps);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}
}
