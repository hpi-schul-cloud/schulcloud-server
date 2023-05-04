import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import {
	customParameterDOFactory,
	externalToolDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolVersionService } from './external-tool-version.service';

describe('ExternalToolVersionService', () => {
	let service: ExternalToolVersionService;

	beforeEach(() => {
		service = new ExternalToolVersionService();
	});

	const setup = () => {
		const param1: CustomParameterDO = new CustomParameterDO({
			name: 'param1',
			displayName: 'displayName',
			default: 'defaulValueParam1',
			isOptional: false,
			location: CustomParameterLocation.PATH,
			regex: '*',
			regexComment: '',
			scope: CustomParameterScope.GLOBAL,
			type: CustomParameterType.STRING,
		});
		const oldTool: ExternalToolDO = externalToolDOFactory
			.params({
				parameters: [param1],
				version: 1,
			})
			.build();
		const newTool: ExternalToolDO = { ...oldTool, parameters: [{ ...param1 }] };

		return {
			oldTool,
			newTool,
			param1,
			newToolParams: newTool.parameters as CustomParameterDO[],
		};
	};

	const expectIncreasement = (newTool: ExternalToolDO) => expect(newTool.version).toEqual(2);
	const expectNoIncreasement = (newTool: ExternalToolDO) => expect(newTool.version).toEqual(1);

	describe('increaseVersionOfNewToolIfNecessary is called', () => {
		describe('when customParameters on old tool is not defined', () => {
			it('should not increase version', () => {
				const { oldTool, newTool } = setup();
				oldTool.parameters = undefined;

				service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

				expectNoIncreasement(newTool);
			});

			describe('when customParameters on new tool is not defined', () => {
				it('should not increase version', () => {
					const { oldTool, newTool } = setup();
					newTool.parameters = undefined;

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectNoIncreasement(newTool);
				});
			});
		});

		describe('compareParameters is called', () => {
			describe('when customParameters are the same', () => {
				it('should not increase version', () => {
					const { oldTool, newTool } = setup();

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectNoIncreasement(newTool);
				});
			});

			describe('when length of customParameters is different', () => {
				it('should increase version', () => {
					const { oldTool, newTool } = setup();
					newTool.parameters?.push(customParameterDOFactory.build());

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});

		describe('hasNewRequiredParameter is called', () => {
			describe('when new required parameter exists', () => {
				it('should increase version', () => {
					const { oldTool, newTool } = setup();
					newTool.parameters?.push(customParameterDOFactory.build({ isOptional: false }));

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});

		describe('hasChangedParameterNames is called', () => {
			describe('when the name of some customParameter has changed', () => {
				it('should increase version', () => {
					const { oldTool, newTool, param1 } = setup();
					param1.name = 'newName';

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});

			describe('when a new optional custom parameter added', () => {
				it('should not increase version', () => {
					const { oldTool, newTool, newToolParams } = setup();
					const newOptionalParam: CustomParameterDO = customParameterDOFactory.build({ isOptional: true });
					newToolParams.push(newOptionalParam);

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectNoIncreasement(newTool);
				});
			});
		});

		describe('hasChangedRequiredParameters is called', () => {
			describe('when one customParameter change from optional to required', () => {
				it('should increase version', () => {
					const { oldTool, newTool, param1 } = setup();
					param1.isOptional = true;

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});

		describe('hasChangedParameterRegex is called', () => {
			describe('when one customParameter has a changed regex', () => {
				it('should increase version', () => {
					const { oldTool, newTool, param1 } = setup();
					param1.regex = '.+';

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});

		describe('hasChangedParameterTypes is called', () => {
			describe('when one customParameter has a changed type', () => {
				it('should increase version', () => {
					const { oldTool, newTool, param1 } = setup();
					param1.type = CustomParameterType.BOOLEAN;

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});

		describe('hasChangedParameterScope is called', () => {
			describe('when one customParameter has a changed scope', () => {
				it('should increase version', () => {
					const { oldTool, newTool, param1 } = setup();
					param1.scope = CustomParameterScope.SCHOOL;

					service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

					expectIncreasement(newTool);
				});
			});
		});
	});
});
