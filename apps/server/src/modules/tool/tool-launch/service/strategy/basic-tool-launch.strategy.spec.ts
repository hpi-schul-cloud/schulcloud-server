import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { externalToolFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { ContextExternalTool } from '@src/modules/tool/context-external-tool/domain/context-external-tool.do';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';
import { LaunchRequestMethod } from '../../types/launch-request-method';
import { PropertyData } from '../../types/property-data';
import { PropertyLocation } from '../../types/property-location';
import { BasicToolLaunchStrategy } from './basic-tool-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';

describe('BasicToolLaunchStrategy', () => {
	let module: TestingModule;
	let basicToolLaunchStrategy: BasicToolLaunchStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BasicToolLaunchStrategy,
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
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
			const externalTool: ExternalTool = externalToolFactory.build();
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

			const data: IToolLaunchParams = {
				contextExternalTool,
				schoolExternalTool,
				externalTool,
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
