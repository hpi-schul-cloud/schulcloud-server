import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { isNaN } from 'lodash';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../domain';
import { ExternalTool } from '../../external-tool/domain';
import { CustomParameterDO, CustomParameterEntryDO } from '../../common/domain';
import { CustomParameterScope, CustomParameterType } from '../../common/enum';

const typeCheckers: { [key in CustomParameterType]: (val: string) => boolean } = {
	[CustomParameterType.STRING]: () => true,
	[CustomParameterType.NUMBER]: (val: string) => !isNaN(Number(val)),
	[CustomParameterType.BOOLEAN]: (val: string) => val === 'true' || val === 'false',
	[CustomParameterType.AUTO_CONTEXTID]: () => true,
	[CustomParameterType.AUTO_CONTEXTNAME]: () => true,
	[CustomParameterType.AUTO_SCHOOLID]: () => true,
	[CustomParameterType.AUTO_SCHOOLNUMBER]: () => true,
};

@Injectable()
export class SchoolExternalToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validate(schoolExternalTool: SchoolExternalTool): Promise<void> {
		this.checkForDuplicateParameters(schoolExternalTool);
		const loadedExternalTool: ExternalTool = await this.externalToolService.findExternalToolById(
			schoolExternalTool.toolId
		);
		this.checkVersionMatch(schoolExternalTool.toolVersion, loadedExternalTool.version);
		this.checkCustomParameterEntries(loadedExternalTool, schoolExternalTool);
	}

	private checkForDuplicateParameters(schoolExternalToolDO: SchoolExternalTool): void {
		const caseInsensitiveNames = schoolExternalToolDO.parameters.map(({ name }: CustomParameterEntryDO) =>
			name.toLowerCase()
		);
		const uniqueNames = new Set(caseInsensitiveNames);
		if (!(uniqueNames.size === schoolExternalToolDO.parameters.length)) {
			throw new ValidationError(
				`tool_param_duplicate: The tool ${
					schoolExternalToolDO.name || ''
				} contains multiple of the same custom parameters.`
			);
		}
	}

	private checkVersionMatch(schoolExternalToolVersion: number, externalToolVersion: number): void {
		if (!(schoolExternalToolVersion === externalToolVersion)) {
			throw new ValidationError(
				`tool_version_mismatch: The version ${schoolExternalToolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolVersion}.`
			);
		}
	}

	private checkCustomParameterEntries(loadedExternalTool: ExternalTool, schoolExternalTool: SchoolExternalTool) {
		if (loadedExternalTool.parameters) {
			for (const param of loadedExternalTool.parameters) {
				const foundEntry: CustomParameterEntryDO | undefined = schoolExternalTool.parameters.find(
					({ name }: CustomParameterEntryDO) => name.toLowerCase() === param.name.toLowerCase()
				);
				if (CustomParameterScope.SCHOOL === param.scope) {
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
				`tool_param_required: The parameter with name ${param.name} is required but not found in the schoolExternalTool.`
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
