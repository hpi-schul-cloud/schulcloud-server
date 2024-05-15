import { contextExternalToolFactory, customParameterFactory } from '@shared/testing';
import { MissingToolParameterValueLoggableException } from './missing-tool-parameter-value.loggable-exception';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { CustomParameter } from '../../common/domain';

describe('MissingToolParameterValueLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

			const customParameters: CustomParameter[] = customParameterFactory.buildList(2);

			const exception = new MissingToolParameterValueLoggableException(contextExternalTool, customParameters);

			return {
				contextExternalTool,
				customParameters,
				exception,
			};
		};

		it('should log the correct message', () => {
			const { contextExternalTool, customParameters, exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MISSING_TOOL_PARAMETER_VALUE',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					contextExternalToolId: contextExternalTool.id,
					parameterNames: `[${customParameters[0].name}, ${customParameters[1].name}]`,
				},
			});
		});
	});
});
