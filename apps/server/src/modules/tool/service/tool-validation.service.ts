import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCreate(externalToolDO: ExternalToolDO): Promise<void> {
		await this.validateCommon(externalToolDO);

		if (externalToolDO.config instanceof Oauth2ToolConfigDO && !(await this.isClientIdUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
		}
	}

	async validateUpdate(toolId: string, externalToolDO: Partial<ExternalToolDO>): Promise<void> {
		if (toolId !== externalToolDO.id) {
			throw new UnprocessableEntityException(`The tool has no id or it does not match the path parameter.`);
		}

		await this.validateCommon(externalToolDO);

		const loadedTool: ExternalToolDO = await this.externalToolService.findExternalToolById(toolId);
		if (
			loadedTool.config instanceof Oauth2ToolConfigDO &&
			externalToolDO.config &&
			externalToolDO.config.type !== loadedTool.config.type
		) {
			throw new UnprocessableEntityException(`The Config Type of the tool ${externalToolDO.name || ''} is immutable`);
		}

		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			loadedTool.config instanceof Oauth2ToolConfigDO &&
			externalToolDO.config.clientId !== loadedTool.config.clientId
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool ${externalToolDO.name || ''} is immutable`);
		}
	}

	private async validateCommon(externalToolDO: ExternalToolDO | Partial<ExternalToolDO>): Promise<void> {
		if (!(await this.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name || ''}" is already used`);
		}
		if (externalToolDO.parameters) {
			if (this.hasDuplicateAttributes(externalToolDO.parameters)) {
				throw new UnprocessableEntityException(
					`The tool: ${externalToolDO.name || ''} contains multiple of the same custom parameters`
				);
			}
			if (!this.validateByRegex(externalToolDO.parameters)) {
				throw new UnprocessableEntityException(
					`A custom Parameter of the tool: ${externalToolDO.name || ''} has wrong regex attribute`
				);
			}
			externalToolDO.parameters.forEach((param: CustomParameterDO) => {
				if (!this.isRegexCommentMandatoryAndFilled(param)) {
					throw new UnprocessableEntityException(`The "${param.name}" parameter is missing a regex comment.`);
				}
			});
		}
	}

	private async isNameUnique(externalToolDO: ExternalToolDO | Partial<ExternalToolDO>): Promise<boolean> {
		if (!externalToolDO.name) {
			return true;
		}
		const duplicate: ExternalToolDO | null = await this.externalToolService.findExternalToolByName(externalToolDO.name);
		return duplicate == null || duplicate.id === externalToolDO.id;
	}

	private async isClientIdUnique(externalToolDO: ExternalToolDO): Promise<boolean> {
		let duplicate: ExternalToolDO | null = null;
		if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			duplicate = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(externalToolDO.config.clientId);
		}
		return duplicate == null || duplicate.id === externalToolDO.id;
	}

	private hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item, itemIndex) =>
			customParameter.some((other, otherIndex) => itemIndex !== otherIndex && item.name === other.name)
		);
	}

	private validateByRegex(customParameter: CustomParameterDO[]): boolean {
		return customParameter.every((param: CustomParameterDO) => {
			if (param.regex) {
				try {
					// eslint-disable-next-line no-new
					new RegExp(param.regex);
					if (param.default) {
						// eslint-disable-next-line no-new
						new RegExp(param.default);
					}
				} catch (e) {
					return false;
				}
			}
			return true;
		});
	}

	isRegexCommentMandatoryAndFilled(customParameter: CustomParameterDO): boolean {
		if (customParameter.regex && !customParameter.regexComment) {
			return false;
		}
		return true;
	}
}
