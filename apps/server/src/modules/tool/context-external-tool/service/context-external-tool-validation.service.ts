import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	public async validate(contextExternalTool: ContextExternalTool): Promise<void> {
		const loadedSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const loadedExternalTool: ExternalTool = await this.externalToolService.findById(loadedSchoolExternalTool.toolId);

		const errors: ValidationError[] = this.commonToolValidationService.validateParameters(
			loadedExternalTool,
			contextExternalTool
		);

		if (errors.length) {
			throw errors[0];
		}
	}
}
