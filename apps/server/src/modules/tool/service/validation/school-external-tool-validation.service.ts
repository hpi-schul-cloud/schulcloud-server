import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CustomParameterScope, CustomParameterType } from '@shared/domain';
import { CustomParameterDO, CustomParameterEntryDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { isNaN } from 'lodash';
import { ExternalToolService } from '../external-tool.service';

const typeCheckers: { [key in CustomParameterType]: (val: string) => boolean } = {
	[CustomParameterType.STRING]: () => true,
	[CustomParameterType.NUMBER]: (val: string) => !isNaN(Number(val)),
	[CustomParameterType.BOOLEAN]: (val: string) => val === 'true' || val === 'false',
	[CustomParameterType.AUTO_COURSEID]: () => true,
	[CustomParameterType.AUTO_COURSENAME]: () => true,
	[CustomParameterType.AUTO_SCHOOLID]: () => true,
};

@Injectable()
export class SchoolExternalToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validate(schoolExternalToolDO: SchoolExternalToolDO): Promise<void> {
		this.checkForDuplicateParameters(schoolExternalToolDO);
		const loadedExternalTool: ExternalToolDO = await this.externalToolService.findExternalToolById(
			schoolExternalToolDO.toolId
		);
		this.checkVersionMatch(schoolExternalToolDO.toolVersion, loadedExternalTool.version);
		this.checkCustomParameterEntries(loadedExternalTool, schoolExternalToolDO);
	}

	private checkForDuplicateParameters(schoolExternalToolDO: SchoolExternalToolDO): void {
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

	private checkCustomParameterEntries(loadedExternalTool: ExternalToolDO, schoolExternalToolDO: SchoolExternalToolDO) {
		if (loadedExternalTool.parameters) {
			for (const param of loadedExternalTool.parameters) {
				const foundEntry: CustomParameterEntryDO | undefined = schoolExternalToolDO.parameters.find(
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
