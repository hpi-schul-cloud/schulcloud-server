import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { CustomParameter } from '../../domain';
import { CustomParameterScope } from '../../enum';
import {
	ParameterArrayDuplicateKeyValidator,
	ParameterArrayEntryValidator,
	ParameterArrayUnknownKeyValidator,
	ParameterArrayValidator,
} from './rules';

export type ValidatableTool = SchoolExternalTool | ContextExternalTool;

@Injectable()
export class CommonToolValidationService {
	private readonly arrayValidators: ParameterArrayValidator[] = [
		new ParameterArrayDuplicateKeyValidator(),
		new ParameterArrayUnknownKeyValidator(),
		new ParameterArrayEntryValidator(),
	];

	public validateParameters(loadedExternalTool: ExternalTool, validatableTool: ValidatableTool): ValidationError[] {
		const errors: ValidationError[] = [];

		const parametersForScope: CustomParameter[] = (loadedExternalTool.parameters ?? []).filter(
			(param: CustomParameter) =>
				(validatableTool instanceof SchoolExternalTool && param.scope === CustomParameterScope.SCHOOL) ||
				(validatableTool instanceof ContextExternalTool && param.scope === CustomParameterScope.CONTEXT)
		);

		this.arrayValidators.forEach((validator: ParameterArrayValidator) => {
			const entryErrors: ValidationError[] = validator.validate(validatableTool.parameters, parametersForScope);

			errors.push(...entryErrors);
		});

		return errors;
	}
}
