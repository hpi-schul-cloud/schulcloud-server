import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { LaunchRequestMethod, PropertyData } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { AutoMediumIdStrategy } from '../auto-parameter-strategy/auto-medium-id.strategy';
import { OAuth2ToolLaunchStrategy } from './oauth2-tool-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

describe('OAuth2ToolLaunchStrategy', () => {
	let module: TestingModule;
	let strategy: OAuth2ToolLaunchStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuth2ToolLaunchStrategy,
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

				const data: ToolLaunchParams = {
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
