import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { isNaN } from 'lodash';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { CustomParameter, CustomParameterEntry } from '../domain';
import { CustomParameterScope, CustomParameterType } from '../enum';

export type ValidatableTool = SchoolExternalTool | ContextExternalTool;

@Injectable()
export class CommonToolValidationService {
	private static typeCheckers: { [key in CustomParameterType]: (val: string) => boolean } = {
		[CustomParameterType.STRING]: () => true,
		[CustomParameterType.NUMBER]: (val: string | undefined) => !isNaN(Number(val)),
		[CustomParameterType.BOOLEAN]: (val: string | undefined) => val === 'true' || val === 'false',
		[CustomParameterType.AUTO_CONTEXTID]: () => false,
		[CustomParameterType.AUTO_CONTEXTNAME]: () => false,
		[CustomParameterType.AUTO_SCHOOLID]: () => false,
		[CustomParameterType.AUTO_SCHOOLNUMBER]: () => false,
	};

	public isValueValidForType(type: CustomParameterType, val: string): boolean {
		const rule = CommonToolValidationService.typeCheckers[type];

		const isValid: boolean = rule(val);

		return isValid;
	}

	public checkForDuplicateParameters(validatableTool: ValidatableTool): void {
		const caseInsensitiveNames: string[] = validatableTool.parameters.map(({ name }: CustomParameterEntry) =>
			name.toLowerCase()
		);

		const uniqueNames: Set<string> = new Set(caseInsensitiveNames);
		if (uniqueNames.size !== validatableTool.parameters.length) {
			throw new ValidationError(
				`tool_param_duplicate: The tool ${validatableTool.id ?? ''} contains multiple of the same custom parameters.`
			);
		}
	}

	public checkCustomParameterEntries(loadedExternalTool: ExternalTool, validatableTool: ValidatableTool) {
		if (loadedExternalTool.parameters) {
			for (const param of loadedExternalTool.parameters) {
				this.checkScopeAndValidateParameter(validatableTool, param);
			}
		}
	}

	private checkScopeAndValidateParameter(validatableTool: ValidatableTool, param: CustomParameter): void {
		const foundEntry: CustomParameterEntry | undefined = validatableTool.parameters.find(
			({ name }: CustomParameterEntry): boolean => name.toLowerCase() === param.name.toLowerCase()
		);

		if (param.scope === CustomParameterScope.SCHOOL && validatableTool instanceof SchoolExternalTool) {
			this.validateParameter(param, foundEntry);
		} else if (param.scope === CustomParameterScope.CONTEXT && validatableTool instanceof ContextExternalTool) {
			this.validateParameter(param, foundEntry);
		}
	}

	private validateParameter(param: CustomParameter, foundEntry: CustomParameterEntry | undefined): void {
		this.checkOptionalParameter(param, foundEntry);
		if (foundEntry) {
			this.checkParameterType(foundEntry, param);
			this.checkParameterRegex(foundEntry, param);
		}
	}

	private checkOptionalParameter(param: CustomParameter, foundEntry: CustomParameterEntry | undefined): void {
		if (!foundEntry?.value && !param.isOptional) {
			throw new ValidationError(
				`tool_param_required: The parameter with name ${param.name} is required but not found in the tool.`
			);
		}
	}

	private checkParameterType(foundEntry: CustomParameterEntry, param: CustomParameter): void {
		if (foundEntry.value !== undefined && !this.isValueValidForType(param.type, foundEntry.value)) {
			throw new ValidationError(
				`tool_param_type_mismatch: The value of parameter with name ${foundEntry.name} should be of type ${param.type}.`
			);
		}
	}

	private checkParameterRegex(foundEntry: CustomParameterEntry, param: CustomParameter): void {
		if (param.regex && !new RegExp(param.regex).test(foundEntry.value ?? '')) {
			throw new ValidationError(
				`tool_param_value_regex: The given entry for the parameter with name ${foundEntry.name} does not fit the regex.`
			);
		}
	}
}
