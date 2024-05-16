import { Injectable } from '@nestjs/common';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoSchoolIdStrategy implements AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contextExternalTool: ContextExternalToolLaunchable
	): string | undefined {
		return schoolExternalTool.schoolId;
	}
}
