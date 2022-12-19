import { Injectable } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';

@Injectable()
export class ExternalToolVersionService {
	increaseVersionOfNewToolIfNecessary(oldTool: ExternalToolDO, newTool: ExternalToolDO): void {
		if (!oldTool.parameters || !newTool.parameters) {
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
			this.hasNewRequiredParameter(oldParams, newParams) ||
			this.hasChangedRequiredParameters(oldParams, newParams) ||
			this.hasChangedParameterNames(oldParams, newParams) ||
			this.hasChangedParameterRegex(newParams, matchingParams) ||
			this.hasChangedParameterTypes(newParams, matchingParams) ||
			this.hasChangedParameterScope(newParams, matchingParams);

		return shouldIncrementVersion;
	}

	private hasNewRequiredParameter(oldParams: CustomParameterDO[], newParams: CustomParameterDO[]): boolean {
		const increase = newParams.some(
			(newParam) => !newParam.isOptional && oldParams.every((oldParam) => oldParam.name !== newParam.name)
		);
		return increase;
	}

	private hasChangedParameterNames(oldParams: CustomParameterDO[], newParams: CustomParameterDO[]): boolean {
		const names1: string[] = oldParams.map((parameter) => parameter.name);
		const names2: string[] = newParams.map((parameter) => parameter.name);
		const increase = !!(names1.some((name) => !names2.includes(name)) || names2.some((name) => !names1.includes(name)));
		return increase;
	}

	private hasChangedRequiredParameters(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.isOptional !== newParam.isOptional;
		});
		return increase;
	}

	private hasChangedParameterRegex(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.regex !== newParam.regex;
		});
		return increase;
	}

	private hasChangedParameterTypes(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.type !== newParam.type;
		});
		return increase;
	}

	private hasChangedParameterScope(newParams: CustomParameterDO[], matchingParams: CustomParameterDO[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.scope !== newParam.scope;
		});
		return increase;
	}
}
