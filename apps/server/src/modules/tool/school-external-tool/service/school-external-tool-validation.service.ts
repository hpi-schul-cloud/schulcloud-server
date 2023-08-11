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
		this.commonToolValidationService.checkForDuplicateParameters(schoolExternalTool);

		const loadedExternalTool: ExternalTool = await this.externalToolService.findExternalToolById(
			schoolExternalTool.toolId
		);

		this.checkVersionMatch(schoolExternalTool.toolVersion, loadedExternalTool.version);

		this.commonToolValidationService.checkCustomParameterEntries(loadedExternalTool, schoolExternalTool);
	}

	private checkVersionMatch(schoolExternalToolVersion: number, externalToolVersion: number): void {
		if (schoolExternalToolVersion !== externalToolVersion) {
			throw new ValidationError(
				`tool_version_mismatch: The version ${schoolExternalToolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolVersion}.`
			);
		}
	}
}
