import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ExternalToolService } from './external-tool.service';
import { autoParameters, CustomParameterScope } from '../../common/enum';
import { ExternalTool } from '../domain';
import { CustomParameter } from '../../common/domain';

@Injectable()
export class ExternalToolParameterValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCommon(externalTool: ExternalTool | Partial<ExternalTool>): Promise<void> {
		if (!(await this.isNameUnique(externalTool))) {
			throw new ValidationError(`tool_name_duplicate: The tool name "${externalTool.name || ''}" is already used.`);
		}
		if (externalTool.parameters) {
			if (this.isCustomParameterNameEmpty(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_name: The tool ${externalTool.name || ''} is missing at least one custom parameter name.`
				);
			}

			if (this.hasInvalidBooleanValue(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_boolean_invalid: The tool ${externalTool.name || ''} does not contain a valid boolean.`
				);
			}

			if (this.hasDuplicateAttributes(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_duplicate: The tool ${externalTool.name || ''} contains multiple of the same custom parameters.`
				);
			}
			if (!this.validateByRegex(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_regex_invalid: A custom Parameter of the tool ${
						externalTool.name || ''
					} has wrong regex attribute.`
				);
			}
			if (!this.validateDefaultValue(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_default_regex: The default value of a custom parameter of the tool: ${
						externalTool.name || ''
					} does not match its regex`
				);
			}
			externalTool.parameters.forEach((param: CustomParameter) => {
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

	private isCustomParameterNameEmpty(customParameters: CustomParameter[]): boolean {
		const isEmpty = customParameters.some((param: CustomParameter) => !param.name);

		return isEmpty;
	}

	private async isNameUnique(externalTool: ExternalTool | Partial<ExternalTool>): Promise<boolean> {
		if (!externalTool.name) {
			return true;
		}

		const duplicate: ExternalTool | null = await this.externalToolService.findExternalToolByName(externalTool.name);

		return duplicate == null || duplicate.id === externalTool.id;
	}

	private hasDuplicateAttributes(customParameter: CustomParameter[]): boolean {
		return customParameter.some((item, itemIndex) =>
			customParameter.some(
				(other, otherIndex) =>
					itemIndex !== otherIndex && item.name.toLocaleLowerCase() === other.name.toLocaleLowerCase()
			)
		);
	}

	private hasInvalidBooleanValue(customParameter: CustomParameter[]): boolean {
		if (customParameter.length === 0) {
			return false;
		}

		return customParameter.every((param: CustomParameter) => {
			if (param.type === 'boolean' && param.default) {
				return !['true', 'false'].includes(param.default);
			}
			return false;
		});
	}

	private validateByRegex(customParameter: CustomParameter[]): boolean {
		return customParameter.every((param: CustomParameter) => {
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

	private validateDefaultValue(customParameter: CustomParameter[]): boolean {
		const isValid: boolean = customParameter.every((param: CustomParameter) => {
			if (param.regex && param.default) {
				const reg = new RegExp(param.regex);
				const match: boolean = reg.test(param.default);
				return match;
			}
			return true;
		});

		return isValid;
	}

	private isRegexCommentMandatoryAndFilled(customParameter: CustomParameter): boolean {
		if (customParameter.regex && !customParameter.regexComment) {
			return false;
		}

		return true;
	}

	private isGlobalParameterValid(customParameter: CustomParameter): boolean {
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

	private isAutoParameterGlobal(customParameter: CustomParameter): boolean {
		if (!autoParameters.includes(customParameter.type)) {
			return true;
		}

		const isGlobal: boolean = customParameter.scope === CustomParameterScope.GLOBAL;

		return isGlobal;
	}
}
