import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ExternalToolService } from '../external-tool.service';

@Injectable()
export class CommonToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCommon(externalToolDO: ExternalToolDO | Partial<ExternalToolDO>): Promise<void> {
		if (!(await this.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name || ''}" is already used.`);
		}
		if (externalToolDO.parameters) {
			if (this.hasDuplicateAttributes(externalToolDO.parameters)) {
				throw new UnprocessableEntityException(
					`The tool ${externalToolDO.name || ''} contains multiple of the same custom parameters.`
				);
			}
			if (!this.validateByRegex(externalToolDO.parameters)) {
				throw new UnprocessableEntityException(
					`A custom Parameter of the tool ${externalToolDO.name || ''} has wrong regex attribute.`
				);
			}
			if (!this.validateDefaultValue(externalToolDO.parameters)) {
				throw new UnprocessableEntityException(
					`The default value of a custom parameter of the tool: ${externalToolDO.name || ''} does not match its regex`
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
}
