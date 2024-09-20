import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ToolContextType } from '../../common/enum';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolInvalidAvailableContextsException } from '../domain/error';
import { SchoolExternalTool } from '../domain';

@Injectable()
export class SchoolExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validate(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const loadedExternalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		const errors: ValidationError[] = this.commonToolValidationService.validateParameters(
			loadedExternalTool,
			schoolExternalTool
		);

		if (errors.length) {
			throw errors[0];
		}
	}

	async validateAvailableContexts(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const loadedExternalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);
		const validContexts: ToolContextType[] = loadedExternalTool.restrictToContexts ?? Object.values(ToolContextType);

		const hasInvalidContexts = schoolExternalTool.availableContexts.some(
			(context: ToolContextType) => !validContexts.includes(context)
		);

		if (hasInvalidContexts) {
			throw new SchoolExternalToolInvalidAvailableContextsException(schoolExternalTool, validContexts);
		}
	}
}
