import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolDO,
	CustomParameterDO,
	CustomParameterEntryDO,
	CustomParameterScope,
	CustomParameterType,
	ExternalToolDO,
	SchoolExternalToolDO,
} from '@shared/domain';
import { isNaN } from 'lodash';

const typeCheckers: { [key in CustomParameterType]: (val: string) => boolean } = {
	[CustomParameterType.STRING]: () => true,
	[CustomParameterType.NUMBER]: (val: string) => !isNaN(Number(val)),
	[CustomParameterType.BOOLEAN]: (val: string) => val === 'true' || val === 'false',
	[CustomParameterType.AUTO_CONTEXTID]: () => true,
	[CustomParameterType.AUTO_CONTEXTNAME]: () => true,
	[CustomParameterType.AUTO_SCHOOLID]: () => true,
	[CustomParameterType.AUTO_SCHOOLNUMBER]: () => true,
};

export type ValidatableTool = SchoolExternalToolDO | ContextExternalToolDO;

@Injectable()
export class CommonToolValidationService {
	public checkForDuplicateParameters(validatableTool: ValidatableTool): void {
		const caseInsensitiveNames: string[] = validatableTool.parameters.map(({ name }: CustomParameterEntryDO) =>
			name.toLowerCase()
		);

		const uniqueNames: Set<string> = new Set(caseInsensitiveNames);
		if (uniqueNames.size !== validatableTool.parameters.length) {
			throw new ValidationError(
				`tool_param_duplicate: The tool ${validatableTool.id ?? ''} contains multiple of the same custom parameters.`
			);
		}
	}

	public checkCustomParameterEntries(loadedExternalTool: ExternalToolDO, validatableTool: ValidatableTool) {
		if (loadedExternalTool.parameters) {
			for (const param of loadedExternalTool.parameters) {
				const foundEntry: CustomParameterEntryDO | undefined = validatableTool.parameters.find(
					({ name }: CustomParameterEntryDO) => name.toLowerCase() === param.name.toLowerCase()
				);
				if (CustomParameterScope.SCHOOL === param.scope || CustomParameterScope.CONTEXT === param.scope) {
					this.checkOptionalParameter(param, foundEntry);
					if (foundEntry) {
						this.checkParameterType(foundEntry, param);
						this.checkParameterRegex(foundEntry, param);
					}
				}
			}
		}
	}

	private checkOptionalParameter(param: CustomParameterDO, foundEntry: CustomParameterEntryDO | undefined): void {
		if (!foundEntry?.value && !param.isOptional) {
			throw new ValidationError(
				`tool_param_required: The parameter with name ${param.name} is required but not found in the tool.`
			);
		}
	}

	private checkParameterType(foundEntry: CustomParameterEntryDO, param: CustomParameterDO): void {
		if (foundEntry.value !== undefined && !typeCheckers[param.type](foundEntry.value)) {
			throw new ValidationError(
				`tool_param_type_mismatch: The value of parameter with name ${foundEntry.name} should be of type ${param.type}.`
			);
		}
	}

	private checkParameterRegex(foundEntry: CustomParameterEntryDO, param: CustomParameterDO): void {
		if (param.regex && !new RegExp(param.regex).test(foundEntry.value ?? '')) {
			throw new ValidationError(
				`tool_param_value_regex: The given entry for the parameter with name ${foundEntry.name} does not fit the regex.`
			);
		}
	}
}
