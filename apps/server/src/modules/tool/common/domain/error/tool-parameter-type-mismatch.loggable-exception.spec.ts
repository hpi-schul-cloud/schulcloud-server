import { customParameterFactory } from '@modules/tool/external-tool/testing';
import { CustomParameter } from '../custom-parameter.do';
import { ToolParameterTypeMismatchLoggableException } from './tool-parameter-type-mismatch.loggable-exception';

describe(ToolParameterTypeMismatchLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const parameter: CustomParameter = customParameterFactory.build();

			const exception: ToolParameterTypeMismatchLoggableException = new ToolParameterTypeMismatchLoggableException(
				'toolId',
				parameter
			);

			return {
				parameter,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, parameter } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'TOOL_PARAMETER_TYPE_MISMATCH',
				message: 'The parameter value has the wrong type.',
				stack: exception.stack,
				data: {
					toolId: 'toolId',
					parameterName: parameter.name,
					parameterType: parameter.type,
				},
			});
		});
	});
});
