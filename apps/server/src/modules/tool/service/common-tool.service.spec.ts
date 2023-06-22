import { ToolConfigurationStatus, ToolVersion } from '@shared/domain';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonToolService } from './common-tool.service';

describe('CommonToolService', () => {
	let module: TestingModule;
	let service: CommonToolService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CommonToolService],
		}).compile();

		service = module.get(CommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('determineToolConfigurationStatus', () => {
		describe('when tool1 and tool2 versions are equal', () => {
			const setup = () => {
				const tool1: ToolVersion = {
					getVersion: (): number => 1,
				};
				const tool2: ToolVersion = {
					getVersion: (): number => 1,
				};

				return {
					tool1,
					tool2,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { tool1, tool2 } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(tool1, tool2);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when tool1 and tool2 versions are not equal', () => {
			const setup = () => {
				const tool1: ToolVersion = {
					getVersion: (): number => 2,
				};
				const tool2: ToolVersion = {
					getVersion: (): number => 1,
				};

				return {
					tool1,
					tool2,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { tool1, tool2 } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(tool1, tool2);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});
	});
});
