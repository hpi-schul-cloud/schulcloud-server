import { Injectable } from '@nestjs/common';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoContextIdStrategy implements AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): string | undefined {
		return contextExternalTool.contextRef.id;
	}
}
