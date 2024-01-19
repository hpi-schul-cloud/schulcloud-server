import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalTool } from '../domain';

@Injectable()
export class SchoolExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	async validate(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const loadedExternalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		if (!this.toolFeatures.toolStatusWithoutVersions) {
			this.checkVersionMatch(schoolExternalTool.toolVersion, loadedExternalTool.version);
		}

		const errors: ValidationError[] = this.commonToolValidationService.validateParameters(
			loadedExternalTool,
			schoolExternalTool
		);

		if (errors.length) {
			throw errors[0];
		}
	}

	private checkVersionMatch(schoolExternalToolVersion: number, externalToolVersion: number): void {
		if (schoolExternalToolVersion !== externalToolVersion) {
			throw new ValidationError(
				`tool_version_mismatch: The version ${schoolExternalToolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolVersion}.`
			);
		}
	}
}
