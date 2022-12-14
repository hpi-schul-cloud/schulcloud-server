import {
	customParameterDOFactory,
	externalToolDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { ExternalToolVersionService } from './external-tool-version.service';

describe('ExternalToolVersionService', () => {
	let service: ExternalToolVersionService;

	beforeEach(() => {
		service = new ExternalToolVersionService();
	});

	const setup = () => {
		const param1: CustomParameterDO = new CustomParameterDO({
			name: 'param1',
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
			param1,
			oldTool,
			newTool,
		};
	};

	const expectIncreasement = (newTool: ExternalToolDO) => expect(newTool.version).toEqual(2);

	it('should not increase the version if the customParameters are the same', () => {
		const { oldTool, newTool } = setup();

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expect(newTool.version).toEqual(1);
	});

	it('should increase when length of customParameters is different', () => {
		const { oldTool, newTool } = setup();
		newTool.parameters?.push(customParameterDOFactory.build());

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expectIncreasement(newTool);
	});

	it('should increase when the name of some customParameter has changed', () => {
		const { oldTool, newTool } = setup();
		newTool.parameters![0].name = 'newName';

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expectIncreasement(newTool);
	});

	it('should increase when one customParameter change from optional to required', () => {
		const { oldTool, newTool } = setup();
		newTool.parameters![0].isOptional = true;

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expectIncreasement(newTool);
	});

	it('should increase when one customParameter has a changed regex', () => {
		const { oldTool, newTool } = setup();
		newTool.parameters![0].regex = '.+';

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expectIncreasement(newTool);
	});

	it('should increase when one customParameter has a changed type', () => {
		const { oldTool, newTool } = setup();
		newTool.parameters![0].type = CustomParameterType.BOOLEAN;

		service.increaseVersionOfNewToolIfNecessary(oldTool, newTool);

		expectIncreasement(newTool);
	});
});
