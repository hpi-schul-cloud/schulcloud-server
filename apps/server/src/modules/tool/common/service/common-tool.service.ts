import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { ToolContextType } from '../enum';

@Injectable()
export class CommonToolService {
	public isContextRestricted(externalTool: ExternalTool, context: ToolContextType): boolean {
		if (externalTool.restrictToContexts?.length && !externalTool.restrictToContexts.includes(context)) {
			return true;
		}
		return false;
	}
}
