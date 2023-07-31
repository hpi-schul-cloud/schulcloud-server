import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo';
import { contextExternalToolDOFactory, externalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { LaunchRequestMethod, PropertyData, PropertyLocation } from '../../types';
import { BasicToolLaunchStrategy } from './basic-tool-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';

describe('BasicToolLaunchStrategy', () => {
	let module: TestingModule;
	let basicToolLaunchStrategy: BasicToolLaunchStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BasicToolLaunchStrategy,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);
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

				const payload: string | null = basicToolLaunchStrategy.buildToolLaunchRequestPayload('url', properties);

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

				const payload: string | null = basicToolLaunchStrategy.buildToolLaunchRequestPayload('url', properties);

				expect(payload).toEqual('{"param1":"value1","param2":"value2"}');
			});
		});
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		const setup = () => {
			const externalToolDO: ExternalTool = externalToolDOFactory.build();
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build();
			const contextExternalToolDO: ContextExternalTool = contextExternalToolDOFactory.build();

			const data: IToolLaunchParams = {
				contextExternalToolDO,
				schoolExternalToolDO: schoolExternalTool,
				externalToolDO,
			};

			return { data };
		};

		it('should build the tool launch data from the basic tool config correctly', async () => {
			const { data } = setup();

			const result: PropertyData[] = await basicToolLaunchStrategy.buildToolLaunchDataFromConcreteConfig(
				'userId',
				data
			);

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

				const result: LaunchRequestMethod = basicToolLaunchStrategy.determineLaunchRequestMethod(properties);

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

				const result: LaunchRequestMethod = basicToolLaunchStrategy.determineLaunchRequestMethod(properties);

				expect(result).toEqual(LaunchRequestMethod.POST);
			});
		});
	});
});
