import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { ExternalTool, ExternalToolMedium } from '../domain';
import { ExternalToolMediumStatus } from '../enum';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolParameterValidationService: ExternalToolParameterValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		@Inject(TOOL_CONFIG_TOKEN) private readonly config: ToolConfig
	) {}

	public async validateCreate(externalTool: ExternalTool): Promise<void> {
		await this.externalToolParameterValidationService.validateCommon(externalTool);

		await this.validateOauth2Config(externalTool);

		this.validateLti11Config(externalTool);

		this.externalToolLogoService.validateLogoSize(externalTool);

		if (externalTool.isPreferred) {
			await this.validatePreferredTool(externalTool);
		}

		if (externalTool.medium) {
			this.validateToolMedium(externalTool.medium);
		}
	}

	public async validateUpdate(toolId: string, externalTool: ExternalTool): Promise<void> {
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

		if (
			ExternalTool.isOauth2Config(externalTool.config) &&
			externalTool.medium?.status === ExternalToolMediumStatus.TEMPLATE
		) {
			throw new ValidationError(
				'tool_template_oauth2_invalid: No templates for tools with OAuth2 configuration allowed.'
			);
		}

		this.externalToolLogoService.validateLogoSize(externalTool);

		if (externalTool.isPreferred) {
			await this.validatePreferredTool(externalTool);
		}

		if (externalTool.medium) {
			this.validateToolMedium(externalTool.medium);
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

			if (externalTool.medium?.status === ExternalToolMediumStatus.TEMPLATE) {
				throw new ValidationError(
					'tool_template_oauth2_invalid: No templates for tools with OAuth2 configuration allowed.'
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

	private async validatePreferredTool(toolToValidate: ExternalTool): Promise<void> {
		if (!toolToValidate.iconName) {
			throw new ValidationError(
				`tool_preferred_tools_missing_icon_name: The icon name of the preferred tool ${toolToValidate.name} is missing.`
			);
		}

		const preferredTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({
			isPreferred: true,
		});

		const isToolToValidateAlreadyPreferred: boolean = preferredTools.data.some(
			(existingPreferredTool: ExternalTool) => existingPreferredTool.id === toolToValidate.id
		);
		if (isToolToValidateAlreadyPreferred) {
			return;
		}

		if (preferredTools.total >= this.config.ctlToolsPreferredToolsLimit) {
			throw new ValidationError(
				`tool_preferred_tools_limit_reached: Unable to add a new preferred tool, the total limit had been reached.`
			);
		}
	}

	private validateToolMedium(medium: ExternalToolMedium): void {
		const { status, mediumId } = medium;

		const errorPrefix = (s: string): string => `tool_medium_status_${s.toLowerCase()}`;

		switch (status) {
			case ExternalToolMediumStatus.ACTIVE:
			case ExternalToolMediumStatus.DRAFT:
				if (!mediumId) {
					throw new ValidationError(
						`${errorPrefix(status)}: This medium is ${status.toLowerCase()} but is not linked to an external medium.`
					);
				}
				break;
			case ExternalToolMediumStatus.TEMPLATE:
				if (mediumId) {
					throw new ValidationError(`${errorPrefix(status)}: This template cannot be linked to a specific medium.`);
				}
				break;

			default:
				throw new ValidationError(`tool_medium_status: This medium status must be one of: active, draft or template.`);
		}
	}
}
