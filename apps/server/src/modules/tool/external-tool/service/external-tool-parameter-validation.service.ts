import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { autoParameters, CustomParameterScope } from '@shared/domain';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/tool';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolParameterValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCommon(externalToolDO: ExternalToolDO | Partial<ExternalToolDO>): Promise<void> {
		if (!(await this.isNameUnique(externalToolDO))) {
			throw new ValidationError(`tool_name_duplicate: The tool name "${externalToolDO.name || ''}" is already used.`);
		}
		if (externalToolDO.parameters) {
			if (this.isCustomParameterNameEmpty(externalToolDO.parameters)) {
				throw new ValidationError(
					`tool_param_name: The tool ${externalToolDO.name || ''} is missing at least one custom parameter name.`
				);
			}

			if (this.hasDuplicateAttributes(externalToolDO.parameters)) {
				throw new ValidationError(
					`tool_param_duplicate: The tool ${externalToolDO.name || ''} contains multiple of the same custom parameters.`
				);
			}
			if (!this.validateByRegex(externalToolDO.parameters)) {
				throw new ValidationError(
					`tool_param_regex_invalid: A custom Parameter of the tool ${
						externalToolDO.name || ''
					} has wrong regex attribute.`
				);
			}
			if (!this.validateDefaultValue(externalToolDO.parameters)) {
				throw new ValidationError(
					`tool_param_default_regex: The default value of a custom parameter of the tool: ${
						externalToolDO.name || ''
					} does not match its regex`
				);
			}
			externalToolDO.parameters.forEach((param: CustomParameterDO) => {
				if (!this.isGlobalParameterValid(param)) {
					throw new ValidationError(
						`tool_param_default_required: The "${param.name}" is a global parameter and requires a default value.`
					);
				}
				if (!this.isAutoParameterGlobal(param)) {
					throw new ValidationError(
						`tool_param_auto_requires_global: The "${param.name}" with type "${param.type}" must have the scope "global", since it is automatically filled.`
					);
				}
				if (!this.isRegexCommentMandatoryAndFilled(param)) {
					throw new ValidationError(
						`tool_param_regexComment: The "${param.name}" parameter is missing a regex comment.`
					);
				}
			});
		}
	}

	private isCustomParameterNameEmpty(customParameters: CustomParameterDO[]): boolean {
		const isEmpty = customParameters.some((param: CustomParameterDO) => !param.name);

		return isEmpty;
	}

	private async isNameUnique(externalToolDO: ExternalToolDO | Partial<ExternalToolDO>): Promise<boolean> {
		if (!externalToolDO.name) {
			return true;
		}

		const duplicate: ExternalToolDO | null = await this.externalToolService.findExternalToolByName(externalToolDO.name);

		return duplicate == null || duplicate.id === externalToolDO.id;
	}

	private hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item, itemIndex) =>
			customParameter.some(
				(other, otherIndex) =>
					itemIndex !== otherIndex && item.name.toLocaleLowerCase() === other.name.toLocaleLowerCase()
			)
		);
	}

	private validateByRegex(customParameter: CustomParameterDO[]): boolean {
		return customParameter.every((param: CustomParameterDO) => {
			if (param.regex) {
				try {
					// eslint-disable-next-line no-new
					new RegExp(param.regex);
				} catch (e) {
					return false;
				}
			}
			return true;
		});
	}

	private validateDefaultValue(customParameter: CustomParameterDO[]): boolean {
		const isValid: boolean = customParameter.every((param: CustomParameterDO) => {
			if (param.regex && param.default) {
				const reg = new RegExp(param.regex);
				const match: boolean = reg.test(param.default);
				return match;
			}
			return true;
		});

		return isValid;
	}

	private isRegexCommentMandatoryAndFilled(customParameter: CustomParameterDO): boolean {
		if (customParameter.regex && !customParameter.regexComment) {
			return false;
		}

		return true;
	}

	private isGlobalParameterValid(customParameter: CustomParameterDO): boolean {
		if (customParameter.scope !== CustomParameterScope.GLOBAL) {
			return true;
		}

		if (autoParameters.includes(customParameter.type)) {
			return true;
		}

		if (customParameter.default) {
			return true;
		}

		return false;
	}

	private isAutoParameterGlobal(customParameter: CustomParameterDO): boolean {
		if (!autoParameters.includes(customParameter.type)) {
			return true;
		}

		const isGlobal: boolean = customParameter.scope === CustomParameterScope.GLOBAL;

		return isGlobal;
	}
}
