import { ConfigService } from '@nestjs/config';
import { LearnroomConfig } from '../learnroom.config';
import { LearnroomConfigService } from './learnroom-config.service';

describe('LearnroomConfigService', () => {
	const setupConfig = (config: Partial<LearnroomConfig>) => {
		const configService = new ConfigService<LearnroomConfig, true>(config);
		const sut = new LearnroomConfigService(configService);

		return { sut };
	};

	describe('isCommonCartridgeCourseImportEnabled', () => {
		describe('when the value is set', () => {
			const setup = () => setupConfig({ FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: true });

			it('should return the value from the config', () => {
				const { sut } = setup();

				expect(sut.isCommonCartridgeImportEnabled).toBe(true);
			});
		});

		describe('when the value is not set', () => {
			const setup = () => setupConfig({});

			it('should return false by default', () => {
				const { sut } = setup();

				expect(sut.isCommonCartridgeImportEnabled).toBe(false);
			});
		});
	});

	describe('commonCartridgeImportMaxFileSize', () => {
		describe('when the value is set', () => {
			const setup = () => setupConfig({ FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: 1000 });

			it('should return the value from the config', () => {
				const { sut } = setup();

				expect(sut.commonCartridgeImportMaxFileSize).toBe(1000);
			});
		});

		describe('when the value is not set', () => {
			const setup = () => setupConfig({});

			it('should return 1GB by default', () => {
				const { sut } = setup();

				expect(sut.commonCartridgeImportMaxFileSize).toBe(1000 * 1000 * 1000);
			});
		});
	});
});
