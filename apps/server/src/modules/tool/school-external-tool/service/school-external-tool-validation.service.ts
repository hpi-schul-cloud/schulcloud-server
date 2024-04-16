import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
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
}
