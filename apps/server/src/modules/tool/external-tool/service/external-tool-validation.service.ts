import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { Page } from '@shared/domain/domainobject';
import { ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolParameterValidationService: ExternalToolParameterValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly configService: ConfigService<ToolConfig, true>
	) {}

	async validateCreate(externalTool: ExternalTool): Promise<void> {
		await this.externalToolParameterValidationService.validateCommon(externalTool);

		await this.validateOauth2Config(externalTool);

		this.validateLti11Config(externalTool);

		this.externalToolLogoService.validateLogoSize(externalTool);

		if (externalTool.isPreferred) {
			await this.validatePreferredTool(externalTool);
		}
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

		if (externalTool.isPreferred) {
			await this.validatePreferredTool(externalTool);
		}
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

	private async validatePreferredTool(preferredTool: ExternalTool): Promise<void> {
		const preferredTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({
			isPreferred: true,
		});
		if (preferredTools.total >= this.configService.get<number>('CTL_TOOLS__PREFERRED_TOOLS_LIMIT')) {
			throw new ValidationError(
				`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
			);
		}

		if (!preferredTool.iconName) {
			throw new ValidationError(
				`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${preferredTool.name} is missing.`
			);
		}
	}
}
