import { LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import { BasicToolLaunchStrategy } from './basic-tool-launch.strategy';

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

			const payload: string = basicToolLaunchStrategy.buildToolLaunchRequestPayload('url', properties);

			expect(payload).toEqual('{"param1":"value1","param2":"value2"}');
		});
	});

	describe('determineLaunchRequestMethod', () => {
		describe('when no body property exists', () => {
			const setup = () => {
				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.PATH,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.QUERY,
				});

				return {
					properties: [property1, property2],
				};
			};

			it('should return GET', () => {
				const { properties } = setup();

				const result: LaunchRequestMethod = basicToolLaunchStrategy.determineLaunchRequestMethod(properties);

				expect(result).toEqual(LaunchRequestMethod.GET);
			});
		});

		describe('when no body property exists', () => {
			const setup = () => {
				const property1: PropertyData = new PropertyData({
					name: 'param1',
					value: 'value1',
					location: PropertyLocation.PATH,
				});

				const property2: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.QUERY,
				});

				const property3: PropertyData = new PropertyData({
					name: 'param2',
					value: 'value2',
					location: PropertyLocation.BODY,
				});

				return {
					properties: [property1, property2, property3],
				};
			};

			it('should return POST', () => {
				const { properties } = setup();

				const result: LaunchRequestMethod = basicToolLaunchStrategy.determineLaunchRequestMethod(properties);

				expect(result).toEqual(LaunchRequestMethod.POST);
			});
		});
	});
});
