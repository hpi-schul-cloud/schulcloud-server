import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CustomParameter } from '../../common/domain';
import { autoParameters, CustomParameterScope, CustomParameterType } from '../../common/enum';
import { ToolParameterTypeValidationUtil } from '../../common/service';
import { ExternalTool } from '../domain';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolParameterValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCommon(externalTool: ExternalTool): Promise<void> {
		if (!(await this.isNameUnique(externalTool))) {
			throw new ValidationError(`tool_name_duplicate: The tool name "${externalTool.name || ''}" is already used.`);
		}

		if (externalTool.parameters) {
			if (this.hasDuplicateAttributes(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_duplicate: The tool ${externalTool.name || ''} contains multiple of the same custom parameters.`
				);
			}

			externalTool.parameters.forEach((param: CustomParameter) => {
				if (this.isCustomParameterNameEmpty(param)) {
					throw new ValidationError(`tool_param_name: A custom parameter is missing a name.`);
				}

				if (!this.isGlobalParameterValid(param)) {
					throw new ValidationError(
						`tool_param_default_required: The custom parameter "${param.name}" is a global parameter and requires a default value.`
					);
				}

				if (!this.isAutoParameterGlobal(param)) {
					throw new ValidationError(
						`tool_param_auto_requires_global: The custom parameter "${param.name}" with type "${param.type}" must have the scope "global", since it is automatically filled.`
					);
				}

				if (!this.isAutoParameterMediumIdValid(param, externalTool)) {
					throw new ValidationError(
						`tool_param_auto_medium_id: The custom parameter "${param.name}" with type "${param.type}" must have the mediumId set.`
					);
				}

				if (!this.isRegexCommentMandatoryAndFilled(param)) {
					throw new ValidationError(
						`tool_param_regexComment: The custom parameter "${param.name}" parameter is missing a regex comment.`
					);
				}

				if (!this.isRegexValid(param)) {
					throw new ValidationError(
						`tool_param_regex_invalid: The custom Parameter "${param.name}" has an invalid regex.`
					);
				}

				if (!this.isDefaultValueOfValidType(param)) {
					throw new ValidationError(
						`tool_param_type_mismatch: The default value of the custom parameter "${param.name}" should be of type "${param.type}".`
					);
				}

				if (!this.isDefaultValueOfValidRegex(param)) {
					throw new ValidationError(
						`tool_param_default_regex: The default value of a the custom parameter "${param.name}" does not match its regex.`
					);
				}
			});
		}
	}

	private isCustomParameterNameEmpty(param: CustomParameter): boolean {
		return !param.name || !param.displayName;
	}

	private async isNameUnique(externalTool: ExternalTool): Promise<boolean> {
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

	private isRegexValid(param: CustomParameter): boolean {
		if (param.regex) {
			try {
				// eslint-disable-next-line no-new
				new RegExp(param.regex);
			} catch (e) {
				return false;
			}
		}

		return true;
	}

	private isDefaultValueOfValidRegex(param: CustomParameter): boolean {
		if (param.regex && param.default) {
			const isValid: boolean = new RegExp(param.regex).test(param.default);

			return isValid;
		}

		return true;
	}

	private isDefaultValueOfValidType(param: CustomParameter): boolean {
		if (param.default) {
			const isValid: boolean = ToolParameterTypeValidationUtil.isValueValidForType(param.type, param.default);

			return isValid;
		}

		return true;
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

		if (autoParameters.includes(customParameter.type) || customParameter.default) {
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

	private isAutoParameterMediumIdValid(customParameter: CustomParameter, externalTool: ExternalTool) {
		if (customParameter.type === CustomParameterType.AUTO_MEDIUMID && !externalTool.medium?.mediumId) {
			return false;
		}

		return true;
	}
}
