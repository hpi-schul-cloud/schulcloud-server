import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoSchoolIdStrategy implements AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contextExternalTool: ContextExternalTool
	): string | undefined {
		return schoolExternalTool.schoolId;
	}
}
