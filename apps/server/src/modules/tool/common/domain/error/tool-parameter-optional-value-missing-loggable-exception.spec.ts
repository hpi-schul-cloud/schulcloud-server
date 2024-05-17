import { customParameterFactory } from '@modules/tool/external-tool/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterOptionalValueMissingLoggableException } from './tool-parameter-optional-value-missing-loggable-exception';

describe(ToolParameterOptionalValueMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterOptionalValueMissingLoggableException =
				new ToolParameterOptionalValueMissingLoggableException('toolId', parameter);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: 'VALUE_MISSING_ON_OPTIONAL_TOOL_PARAMETER',
				message: 'The optional parameter has no value.',
				stack: exception.stack,
				data: {
					parameterName: parameter.name,
					validatableToolId: 'toolId',
				},
			});
		});
	});
});
