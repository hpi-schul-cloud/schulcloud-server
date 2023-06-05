import { basicToolConfigDOFactory } from '@shared/testing';
import { BasicToolConfigDO } from '@shared/domain';
import { BasicToolLaunchStrategy } from './basic-tool-launch.strategy';
import { PropertyData, PropertyLocation } from '../../types';

describe('BasicToolLaunchStrategy', () => {
	let basicToolLaunchStrategy: BasicToolLaunchStrategy;

	beforeEach(() => {
		basicToolLaunchStrategy = new BasicToolLaunchStrategy();
	});

	describe('buildToolLaunchRequestPayload', () => {
		const setup = () => {
			const property1: PropertyData = new PropertyData({
				name: 'param1',
				value: 'value1',
				location: PropertyLocation.BODY,
			});

			const property2: PropertyData = new PropertyData({
				name: 'param2',
				value: 'value2',
				location: PropertyLocation.BODY,
			});

			const property3: PropertyData = new PropertyData({
				name: 'param2',
				value: 'value2',
				location: PropertyLocation.PATH,
			});

			return {
				properties: [property1, property2, property3],
			};
		};

		it('should build the tool launch request payload correctly', () => {
			const { properties } = setup();

			const payload: string = basicToolLaunchStrategy.buildToolLaunchRequestPayload(properties);

			expect(payload).toEqual('{"param1":"value1","param2":"value2"}');
		});
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		const setup = () => {
			const basicToolConfig: BasicToolConfigDO = basicToolConfigDOFactory.build({
				baseUrl: 'https://example.com',
			});

			return { basicToolConfig };
		};

		it('should build the tool launch data from the basic tool config correctly', () => {
			const { basicToolConfig } = setup();

			const result: PropertyData[] = basicToolLaunchStrategy.buildToolLaunchDataFromConcreteConfig(basicToolConfig);

			expect(result).toEqual([]);
		});
	});
});
