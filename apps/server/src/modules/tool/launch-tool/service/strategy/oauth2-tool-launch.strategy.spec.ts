import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolDO, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { contextExternalToolDOFactory, externalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { SchoolService } from '@src/modules/school';
import { LaunchRequestMethod, PropertyData } from '../../types';
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
		describe('when always', () => {
			it('should return undefined', () => {
				const payload: string | null = strategy.buildToolLaunchRequestPayload('url', []);

				expect(payload).toBeNull();
			});
		});
	});

	describe('buildToolLaunchDataFromConcreteConfig', () => {
		describe('when always', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build();
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
				const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build();

				const data: IToolLaunchParams = {
					contextExternalToolDO,
					schoolExternalToolDO,
					externalToolDO,
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
		describe('when always', () => {
			it('should return GET', () => {
				const result: LaunchRequestMethod = strategy.determineLaunchRequestMethod([]);

				expect(result).toEqual(LaunchRequestMethod.GET);
			});
		});
	});
});
