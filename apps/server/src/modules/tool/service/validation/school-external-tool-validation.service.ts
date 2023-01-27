import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { CustomParameterDO, CustomParameterEntryDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { CustomParameterScope, CustomParameterType } from '@shared/domain';
import { isNaN } from 'lodash';
import { ValidationError } from '@shared/common';
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

	async validateCreate(schoolExternalToolDO: SchoolExternalToolDO): Promise<void> {
		this.checkForDuplicateParameters(schoolExternalToolDO.parameters);
		const loadedExternalTool: ExternalToolDO = await this.externalToolService.findExternalToolById(
			schoolExternalToolDO.toolId
		);
		this.checkVersionMatch(schoolExternalToolDO.toolVersion, loadedExternalTool.version);
		this.checkCustomParameterEntries(loadedExternalTool, schoolExternalToolDO);
	}

	private checkForDuplicateParameters(parameters: CustomParameterEntryDO[]): void {
		const caseInsensitiveNames = parameters.map(({ name }: CustomParameterEntryDO) => name.toLowerCase());
		const uniqueNames = new Set(caseInsensitiveNames);
		if (!(uniqueNames.size === parameters.length)) {
			throw new ValidationError('The given schoolExternalTool has one or more duplicates in its parameters.');
		}
	}

	private checkVersionMatch(schoolExternalToolVersion: number, externalToolVersion: number): void {
		if (!(schoolExternalToolVersion === externalToolVersion)) {
			throw new ValidationError(
				`The version ${schoolExternalToolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolVersion}.`
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
						if (CustomParameterType.STRING === param.type) {
							this.checkParameterRegex(foundEntry, param);
						}
					}
				}
			}
		}
	}

	private checkOptionalParameter(param: CustomParameterDO, foundEntry: CustomParameterEntryDO | undefined): void {
		if (!foundEntry && !param.isOptional) {
			throw new ValidationError(
				`The parameter with name ${param.name} is required but not found in the schoolExternalTool.`
			);
		}
	}

	private checkParameterType(foundEntry: CustomParameterEntryDO, param: CustomParameterDO): void {
		if (foundEntry.value && !typeCheckers[param.type](foundEntry.value)) {
			throw new ValidationError(`The value of parameter with name ${foundEntry.name} should be of type ${param.type}.`);
		}
	}

	private checkParameterRegex(foundEntry: CustomParameterEntryDO, param: CustomParameterDO): void {
		if (!param.regex) return;
		if (!new RegExp(param.regex).test(foundEntry.value ?? ''))
			throw new ValidationError(
				`The given entry for the parameter with name ${foundEntry.name} does not fit the regex.`
			);
	}
}
