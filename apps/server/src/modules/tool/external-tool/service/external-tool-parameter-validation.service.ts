import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { CustomParameter } from '../../common/domain';
import { autoParameters, CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../common/enum';
import { ToolParameterTypeValidationUtil } from '../../common/service';
import { ExternalTool } from '../domain';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ExternalToolParameterValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	public async validateCommon(externalTool: ExternalTool): Promise<void> {
		if (!(await this.isExternalToolUnique(externalTool))) {
			if (externalTool.isMediaTool()) {
				throw new ValidationError(
					`tool_not_unique: The media tool "${externalTool.name || ''}" (mediumId: "${externalTool.medium?.mediumId || ''}", mediaSourceId: "${externalTool.medium?.mediaSourceId || ''}") is already used.`
				);
			} else {
				throw new ValidationError(`tool_not_unique: The non-media tool "${externalTool.name || ''}" is already used.`);
			}
		}

		if (externalTool.parameters) {
			if (this.hasDuplicateAttributes(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_duplicate: The tool ${externalTool.name || ''} contains multiple of the same custom parameters.`
				);
			}

			if (this.hasMultipleFragmentLocationParameter(externalTool.parameters)) {
				throw new ValidationError(
					`tool_param_multiple_anchor_parameters: The tool ${
						externalTool.name || ''
					} contains multiple anchor (URI fragment) custom parameters.`
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

	public async isExternalToolUnique(externalTool: ExternalTool): Promise<boolean> {
		const { medium } = externalTool;
		if (medium?.mediumId) {
			const existingExternalTool = await this.externalToolService.findExternalToolByMedium(
				medium.mediumId,
				medium.mediaSourceId
			);

			return existingExternalTool == null || existingExternalTool.id === externalTool.id;
		}

		if (medium && !(await this.isTemplateSourceUnique(externalTool))) {
			return false;
		}

		if (!externalTool.name) {
			return true;
		}

		const existingToolsWithName = await this.externalToolService.findExternalToolsByName(externalTool.name);
		const duplicates: ExternalTool[] = existingToolsWithName.filter((duplicate) => duplicate.id !== externalTool.id);
		const nonMediaDuplicates: ExternalTool[] = duplicates.filter((tool) => !tool.isMediaTool());

		return nonMediaDuplicates.length === 0;
	}

	private async isTemplateSourceUnique(externalTool: ExternalTool): Promise<boolean> {
		const existingTemplate = await this.externalToolService.findTemplate(externalTool.medium?.mediaSourceId);

		return existingTemplate == null || existingTemplate.id === externalTool.id;
	}

	private isCustomParameterNameEmpty(param: CustomParameter): boolean {
		return !param.name || !param.displayName;
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
				new RegExp(param.regex);
			} catch {
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

	private isAutoParameterMediumIdValid(customParameter: CustomParameter, externalTool: ExternalTool): boolean {
		if (
			customParameter.type === CustomParameterType.AUTO_MEDIUMID &&
			externalTool.medium?.status !== ExternalToolMediumStatus.TEMPLATE &&
			!externalTool.medium?.mediumId
		) {
			return false;
		}

		return true;
	}

	private hasMultipleFragmentLocationParameter(customParameters: CustomParameter[]): boolean {
		const anchorLocationParams = customParameters.filter(
			(customParameter: CustomParameter) => customParameter.location === CustomParameterLocation.FRAGMENT
		);

		const hasMultiple = anchorLocationParams.length > 1;

		return hasMultiple;
	}
}
