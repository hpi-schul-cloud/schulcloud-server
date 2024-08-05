import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { CustomParameterType } from '../../common/enum';
import { MissingAutoParameterValueLoggableException } from './missing-auto-parameter-value.loggable-exception';

describe(MissingAutoParameterValueLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

			const parameterType: CustomParameterType = CustomParameterType.AUTO_GROUP_EXTERNALUUID;

			const exception = new MissingAutoParameterValueLoggableException(contextExternalTool, parameterType);

			return {
				contextExternalTool,
				parameterType,
				exception,
			};
		};

		it('should give the correct log message', () => {
			const { contextExternalTool, parameterType, exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MISSING_AUTO_PARAMETER_VALUE',
				message:
					'The external tool was attempted to launch, but the value to fill an auto parameter was not found ' +
					'or could not be retrieved successfully',
				stack: expect.any(String),
				data: {
					contextExternalToolId: contextExternalTool.id,
					parameterType,
				},
			});
		});
	});
});
