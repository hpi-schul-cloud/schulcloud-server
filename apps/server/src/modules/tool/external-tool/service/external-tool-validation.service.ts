import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ExternalToolService } from './external-tool.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalTool } from '../domain';

@Injectable()
export class ExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: ExternalToolParameterValidationService
	) {}

	async validateCreate(externalToolDO: ExternalTool): Promise<void> {
		await this.commonToolValidationService.validateCommon(externalToolDO);

		await this.validateOauth2Config(externalToolDO);

		this.validateLti11Config(externalToolDO);
	}

	private async validateOauth2Config(externalToolDO: ExternalTool): Promise<void> {
		if (ExternalTool.isOauth2Config(externalToolDO.config)) {
			if (!externalToolDO.config.clientSecret) {
				throw new ValidationError(
					`tool_clientSecret_missing: The Client Secret of the tool ${externalToolDO.name || ''} is missing.`
				);
			}

			if (!(await this.isClientIdUnique(externalToolDO))) {
				throw new ValidationError(
					`tool_clientId_duplicate: The Client Id of the tool ${externalToolDO.name || ''} is already used.`
				);
			}
		}
	}

	private validateLti11Config(externalToolDO: ExternalTool): void {
		if (ExternalTool.isLti11Config(externalToolDO.config)) {
			if (!externalToolDO.config.secret) {
				throw new ValidationError(
					`tool_secret_missing: The secret of the LTI tool ${externalToolDO.name || ''} is missing.`
				);
			}
		}
	}

	private async isClientIdUnique(externalToolDO: ExternalTool): Promise<boolean> {
		let duplicate: ExternalTool | null = null;
		if (ExternalTool.isOauth2Config(externalToolDO.config)) {
			duplicate = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(externalToolDO.config.clientId);
		}
		return duplicate == null || duplicate.id === externalToolDO.id;
	}

	async validateUpdate(toolId: string, externalToolDO: Partial<ExternalTool>): Promise<void> {
		if (toolId !== externalToolDO.id) {
			throw new ValidationError(`tool_id_mismatch: The tool has no id or it does not match the path parameter.`);
		}

		await this.commonToolValidationService.validateCommon(externalToolDO);

		const loadedTool: ExternalTool = await this.externalToolService.findExternalToolById(toolId);
		if (
			ExternalTool.isOauth2Config(loadedTool.config) &&
			externalToolDO.config &&
			externalToolDO.config.type !== loadedTool.config.type
		) {
			throw new ValidationError(
				`tool_type_immutable: The Config Type of the tool ${externalToolDO.name || ''} is immutable.`
			);
		}

		if (
			externalToolDO.config &&
			ExternalTool.isOauth2Config(externalToolDO.config) &&
			ExternalTool.isOauth2Config(loadedTool.config) &&
			externalToolDO.config.clientId !== loadedTool.config.clientId
		) {
			throw new ValidationError(
				`tool_clientId_immutable: The Client Id of the tool ${externalToolDO.name || ''} is immutable.`
			);
		}
	}
}
