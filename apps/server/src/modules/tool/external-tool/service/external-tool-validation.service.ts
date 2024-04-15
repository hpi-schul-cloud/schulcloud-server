import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ExternalTool } from '../domain';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolParameterValidationService: ExternalToolParameterValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {}

	async validateCreate(externalTool: ExternalTool): Promise<void> {
		await this.externalToolParameterValidationService.validateCommon(externalTool);

		await this.validateOauth2Config(externalTool);

		this.validateLti11Config(externalTool);

		this.externalToolLogoService.validateLogoSize(externalTool);
	}

	async validateUpdate(toolId: string, externalTool: ExternalTool): Promise<void> {
		if (toolId !== externalTool.id) {
			throw new ValidationError(`tool_id_mismatch: The tool has no id or it does not match the path parameter.`);
		}

		await this.externalToolParameterValidationService.validateCommon(externalTool);

		const loadedTool: ExternalTool = await this.externalToolService.findById(toolId);
		if (
			ExternalTool.isOauth2Config(loadedTool.config) &&
			externalTool.config &&
			externalTool.config.type !== loadedTool.config.type
		) {
			throw new ValidationError(
				`tool_type_immutable: The Config Type of the tool ${externalTool.name || ''} is immutable.`
			);
		}

		if (
			externalTool.config &&
			ExternalTool.isOauth2Config(externalTool.config) &&
			ExternalTool.isOauth2Config(loadedTool.config) &&
			externalTool.config.clientId !== loadedTool.config.clientId
		) {
			throw new ValidationError(
				`tool_clientId_immutable: The Client Id of the tool ${externalTool.name || ''} is immutable.`
			);
		}

		this.externalToolLogoService.validateLogoSize(externalTool);
	}

	private async validateOauth2Config(externalTool: ExternalTool): Promise<void> {
		if (ExternalTool.isOauth2Config(externalTool.config)) {
			if (!externalTool.config.clientSecret) {
				throw new ValidationError(
					`tool_clientSecret_missing: The Client Secret of the tool ${externalTool.name || ''} is missing.`
				);
			}

			if (!(await this.isClientIdUnique(externalTool))) {
				throw new ValidationError(
					`tool_clientId_duplicate: The Client Id of the tool ${externalTool.name || ''} is already used.`
				);
			}
		}
	}

	private validateLti11Config(externalTool: ExternalTool): void {
		if (ExternalTool.isLti11Config(externalTool.config)) {
			if (!externalTool.config.secret) {
				throw new ValidationError(
					`tool_secret_missing: The secret of the LTI tool ${externalTool.name || ''} is missing.`
				);
			}
		}
	}

	private async isClientIdUnique(externalTool: ExternalTool): Promise<boolean> {
		let duplicate: ExternalTool | null = null;
		if (ExternalTool.isOauth2Config(externalTool.config)) {
			duplicate = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(externalTool.config.clientId);
		}
		return duplicate == null || duplicate.id === externalTool.id;
	}
}
