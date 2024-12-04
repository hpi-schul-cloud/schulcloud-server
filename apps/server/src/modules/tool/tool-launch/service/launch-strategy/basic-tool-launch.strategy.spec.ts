import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { ExternalTool } from '../../../external-tool/domain';
import { externalToolFactory } from '../../../external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { LaunchRequestMethod, LaunchType, PropertyData, PropertyLocation } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { BasicToolLaunchStrategy } from './basic-tool-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

describe('BasicToolLaunchStrategy', () => {
	let module: TestingModule;
	let strategy: BasicToolLaunchStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BasicToolLaunchStrategy,
				{
					provide: AutoSchoolIdStrategy,
					useValue: createMock<AutoSchoolIdStrategy>(),
				},
				{
					provide: AutoSchoolNumberStrategy,
					useValue: createMock<AutoSchoolNumberStrategy>(),
				},
				{
					provide: AutoContextIdStrategy,
					useValue: createMock<AutoContextIdStrategy>(),
				},
				{
					provide: AutoContextNameStrategy,
					useValue: createMock<AutoContextNameStrategy>(),
				},
				{
					provide: AutoMediumIdStrategy,
					useValue: createMock<AutoMediumIdStrategy>(),
				},
				{
					provide: AutoGroupExternalUuidStrategy,
					useValue: createMock<AutoGroupExternalUuidStrategy>(),
				},
			],
		}).compile();

		strategy = module.get(BasicToolLaunchStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('buildToolLaunchRequestPayload', () => {
		describe('when method is GET', () => {
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

			it('should return null', () => {
				const { properties } = setup();

				const payload: string | null = strategy.buildToolLaunchRequestPayload('url', properties);

				expect(payload).toBeNull();
			});
		});

		describe('when method is POST', () => {
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
					name: 'param3',
					value: 'value3',
					location: PropertyLocation.PATH,
				});

				return {
					properties: [property1, property2, property3],
				};
			};

			it('should build the tool launch request payload correctly', () => {
				const { properties } = setup();

				const payload: string | null = strategy.buildToolLaunchRequestPayload('url', properties);

				expect(payload).toEqual('{"param1":"value1","param2":"value2"}');
			});
		});
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		const setup = () => {
			const externalTool: ExternalTool = externalToolFactory.build();
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

			const data: ToolLaunchParams = {
				contextExternalTool,
				schoolExternalTool,
				externalTool,
			};

			return { data };
		};

		it('should build the tool launch data from the basic tool config correctly', async () => {
			const { data } = setup();

			const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

			expect(result).toEqual([]);
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

				const result: LaunchRequestMethod = strategy.determineLaunchRequestMethod(properties);

				expect(result).toEqual(LaunchRequestMethod.GET);
			});
		});

		describe('when a body property exists', () => {
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
					name: 'param3',
					value: 'value3',
					location: PropertyLocation.BODY,
				});

				return {
					properties: [property1, property2, property3],
				};
			};

			it('should return POST', () => {
				const { properties } = setup();

				const result: LaunchRequestMethod = strategy.determineLaunchRequestMethod(properties);

				expect(result).toEqual(LaunchRequestMethod.POST);
			});
		});
	});

	describe('determineLaunchType', () => {
		describe('whenever it is called', () => {
			it('should return basic', () => {
				const result = strategy.determineLaunchType();

				expect(result).toEqual(LaunchType.BASIC);
			});
		});
	});
});
