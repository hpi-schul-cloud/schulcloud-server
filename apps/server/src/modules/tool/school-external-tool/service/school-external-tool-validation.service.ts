import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool/service';

@Injectable()
export class SchoolExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validate(schoolExternalToolDO: SchoolExternalToolDO): Promise<void> {
		this.commonToolValidationService.checkForDuplicateParameters(schoolExternalToolDO);

		const loadedExternalTool: ExternalToolDO = await this.externalToolService.findExternalToolById(
			schoolExternalToolDO.toolId
		);

		this.checkVersionMatch(schoolExternalToolDO.toolVersion, loadedExternalTool.version);

		this.commonToolValidationService.checkCustomParameterEntries(loadedExternalTool, schoolExternalToolDO);
	}

	private checkVersionMatch(schoolExternalToolVersion: number, externalToolVersion: number): void {
		if (schoolExternalToolVersion !== externalToolVersion) {
			throw new ValidationError(
				`tool_version_mismatch: The version ${schoolExternalToolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolVersion}.`
			);
		}
	}
}
