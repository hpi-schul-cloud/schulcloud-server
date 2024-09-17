import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ToolContextType } from '../enum';

@Injectable()
export class CommonToolService {
	public isContextRestricted(externalTool: ExternalTool, context: ToolContextType): boolean {
		if (externalTool.restrictToContexts?.length && !externalTool.restrictToContexts.includes(context)) {
			return true;
		}
		return false;
	}

	public isSchoolExternalToolAvailableForContext(
		schoolExternalTool: SchoolExternalTool,
		context: ToolContextType
	): boolean {
		const isAvailable: boolean = schoolExternalTool.availableContexts.includes(context);
		return isAvailable;
	}
}
