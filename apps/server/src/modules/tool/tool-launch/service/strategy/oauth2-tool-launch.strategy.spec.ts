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
import { OAuth2ToolLaunchStrategy } from './oauth2-tool-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';

describe('OAuth2ToolLaunchStrategy', () => {
	let module: TestingModule;
	let strategy: OAuth2ToolLaunchStrategy;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuth2ToolLaunchStrategy,
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

		strategy = module.get(OAuth2ToolLaunchStrategy);
	});

	describe('buildToolLaunchRequestPayload', () => {
		describe('whenever it is called', () => {
			it('should return undefined', () => {
				const payload: string | null = strategy.buildToolLaunchRequestPayload('url', []);

				expect(payload).toBeNull();
			});
		});
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		describe('whenever it is called', () => {
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

			it('should return an empty array', async () => {
				const { data } = setup();

				const result: PropertyData[] = await strategy.buildToolLaunchDataFromConcreteConfig('userId', data);

				expect(result).toEqual([]);
			});
		});
	});

	describe('determineLaunchRequestMethod', () => {
		describe('whenever it is called', () => {
			it('should return GET', () => {
				const result: LaunchRequestMethod = strategy.determineLaunchRequestMethod([]);

				expect(result).toEqual(LaunchRequestMethod.GET);
			});
		});
	});
});
