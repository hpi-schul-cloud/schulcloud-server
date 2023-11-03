import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoContextIdStrategy implements AutoParameterStrategy {
	getValue(schoolExternalTool: SchoolExternalTool, contextExternalTool: ContextExternalTool): string | undefined {
		return contextExternalTool.contextRef.id;
	}
}
