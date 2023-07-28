import { contextExternalToolDOFactory, customParameterDOFactory } from '@shared/testing';
import { MissingToolParameterValueLoggableException } from './missing-tool-parameter-value.loggable-exception';
import { ContextExternalToolDO } from '../../context-external-tool/domainobject';
import { CustomParameterDO } from '../../common/domainobject';

describe('MissingToolParameterValueLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

			const customParameters: CustomParameterDO[] = customParameterDOFactory.buildList(2);

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
