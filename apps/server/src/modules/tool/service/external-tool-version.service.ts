import { Injectable } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';

@Injectable()
export class ExternalToolVersionService {
	increaseVersionOfNewToolIfNecessary(oldTool: ExternalToolDO, newTool: ExternalToolDO): void {
		if (!oldTool || !oldTool.parameters || !newTool.parameters) {
			return;
		}
		if (this.compareParameters(oldTool.parameters, newTool.parameters)) {
			newTool.version += 1;
		}
	}

	private compareParameters(oldParams: CustomParameterDO[], newParams: CustomParameterDO[]): boolean {
		const matchingParams: CustomParameterDO[] = oldParams.filter((oldParam) => {
			return newParams.some((newParam) => oldParam.name === newParam.name);
		});

		const shouldIncrementVersion =
			this.hasChangedArrayLength(oldParams, newParams) ||
			this.hasChangedRequiredParameters(oldParams, newParams) ||
			this.hasChangedParameterNames(oldParams, newParams) ||
			this.hasChangedParameterRegex(newParams, matchingParams) ||
			this.hasChangedParameterTypes(newParams, matchingParams);

		return shouldIncrementVersion;
	}

	private hasChangedArrayLength(oldParams: CustomParameterDO[], newParams: CustomParameterDO[]): boolean {
		return oldParams.length !== newParams.length;
	}

	private hasChangedParameterNames(oldParams: CustomParameterDO[], newParams: CustomParameterDO[]): boolean {
		const names1 = oldParams.map((parameter) => parameter.name);
		const names2 = newParams.map((parameter) => parameter.name);
		return !!(names1.some((name) => !names2.includes(name)) || names2.some((name) => !names1.includes(name)));
	}

	private hasChangedRequiredParameters(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		return matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.isOptional !== newParam.isOptional;
		});
	}

	private hasChangedParameterRegex(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		return matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.regex !== newParam.regex;
		});
	}

	private hasChangedParameterTypes(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		return matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.type !== newParam.type;
		});
	}
}
