import { Injectable } from '@nestjs/common';
import { CustomParameter } from '../../common/domain';
import { ExternalTool } from '../domain';

@Injectable()
export class ExternalToolVersionIncrementService {
	increaseVersionOfNewToolIfNecessary(oldTool: ExternalTool, newTool: ExternalTool): void {
		if (!oldTool.parameters || !newTool.parameters) {
			return;
		}
		if (this.compareParameters(oldTool.parameters, newTool.parameters)) {
			// newTool.version += 1;
		}
	}

	private compareParameters(oldParams: CustomParameter[], newParams: CustomParameter[]): boolean {
		const matchingParams: CustomParameter[] = oldParams.filter((oldParam) =>
			newParams.some((newParam) => oldParam.name === newParam.name)
		);

		const shouldIncrementVersion =
			this.hasNewRequiredParameter(oldParams, newParams) ||
			this.hasChangedRequiredParameters(oldParams, newParams) ||
			this.hasChangedParameterNames(oldParams, newParams) ||
			this.hasChangedParameterRegex(newParams, matchingParams) ||
			this.hasChangedParameterTypes(newParams, matchingParams) ||
			this.hasChangedParameterScope(newParams, matchingParams);

		return shouldIncrementVersion;
	}

	private hasNewRequiredParameter(oldParams: CustomParameter[], newParams: CustomParameter[]): boolean {
		const increase = newParams.some(
			(newParam) => !newParam.isOptional && oldParams.every((oldParam) => oldParam.name !== newParam.name)
		);
		return increase;
	}

	private hasChangedParameterNames(oldParams: CustomParameter[], newParams: CustomParameter[]): boolean {
		const nonOptionalParams = oldParams.filter((parameter) => !parameter.isOptional);
		const nonOptionalParamNames = nonOptionalParams.map((parameter) => parameter.name);

		const newNonOptionalParams = newParams.filter((parameter) => !parameter.isOptional);
		const newNonOptionalParamNames = newNonOptionalParams.map((parameter) => parameter.name);

		const increase =
			nonOptionalParamNames.some((name) => !newNonOptionalParamNames.includes(name)) ||
			newNonOptionalParamNames.some((name) => !nonOptionalParamNames.includes(name));
		return increase;
	}

	private hasChangedRequiredParameters(newParams: CustomParameter[], matchingParams: CustomParameter[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.isOptional !== newParam.isOptional;
		});
		return increase;
	}

	private hasChangedParameterRegex(newParams: CustomParameter[], matchingParams: CustomParameter[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.regex !== newParam.regex;
		});
		return increase;
	}

	private hasChangedParameterTypes(newParams: CustomParameter[], matchingParams: CustomParameter[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.type !== newParam.type;
		});
		return increase;
	}

	private hasChangedParameterScope(newParams: CustomParameter[], matchingParams: CustomParameter[]): boolean {
		const increase = matchingParams.some((param) => {
			const newParam = newParams.find((p) => p.name === param.name);
			return newParam && param.scope !== newParam.scope;
		});
		return increase;
	}
}
