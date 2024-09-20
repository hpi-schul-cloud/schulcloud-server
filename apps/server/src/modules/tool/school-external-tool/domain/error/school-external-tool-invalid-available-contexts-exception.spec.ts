import { SchoolExternalTool } from '../index';
import { schoolExternalToolFactory } from '../../testing';
import { ToolContextType } from '../../../common/enum';
import { SchoolExternalToolInvalidAvailableContextsException } from './school-external-tool-invalid-available-contexts-exception';

describe(SchoolExternalToolInvalidAvailableContextsException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
				availableContexts: [ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT],
			});

			const validContexts: ToolContextType[] = [ToolContextType.COURSE];

			const exception = new SchoolExternalToolInvalidAvailableContextsException(schoolExternalTool, validContexts);

			return {
				exception,
				schoolExternalTool,
				validContexts,
			};
		};

		it('should return the correct log message', () => {
			const { exception, schoolExternalTool, validContexts } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'SCHOOL_EXTERNAL_TOOL_INVALID_AVAILABLE_CONTEXTS',
				message: 'The available contexts of school external tool has one or more invalid contexts',
				stack: exception.stack,
				data: {
					schoolExternalToolId: schoolExternalTool.id,
					schoolExternalToolName: schoolExternalTool.name,
					schoolExternalToolAvailableContexts: schoolExternalTool.availableContexts.join(', '),
					validContexts: validContexts.join(', '),
				},
			});
		});
	});
});
