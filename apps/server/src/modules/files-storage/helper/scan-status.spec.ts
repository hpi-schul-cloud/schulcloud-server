import { ScanStatus } from '@shared/domain';
import { fileRecordFactory } from '@shared/testing';
import { deriveStatusFromSource, getStatusFromScanResult, isStatusBlocked } from '.';
import { ScanResultParams } from '../controller/dto';

describe('Scan Status Helper', () => {
	const getFileRecords = () => {
		const sourceFile = fileRecordFactory.build();
		const targetFile = fileRecordFactory.build();

		return { sourceFile, targetFile };
	};

	describe('getStatusFromScanResult is called', () => {
		describe('WHEN virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_signature: 'bla',
					virus_detected: true,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.BLOCKED);
			});
		});

		describe('WHEN no virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_detected: false,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.VERIFIED);
			});
		});

		describe('WHEN empty scanResult is passed', () => {
			const setup = () => {
				const scanResultParams = {};

				return {
					scanResultParams,
				};
			};

			it('should return verified scan status', () => {
				const { scanResultParams } = setup();

				// @ts-expect-error type do not match
				const result = getStatusFromScanResult(scanResultParams);

				// Otherwise large files can not be processed
				expect(result).toEqual(ScanStatus.VERIFIED);
			});
		});
	});

	describe('deriveStatusFromSource is called', () => {
		describe('WHEN source files scan status is VERIFIED', () => {
			const setup = () => {
				const { sourceFile, targetFile } = getFileRecords();

				sourceFile.securityCheck.status = ScanStatus.VERIFIED;

				return {
					sourceFile,
					targetFile,
				};
			};

			it('should set targets securitycheck by source', () => {
				const { sourceFile, targetFile } = setup();

				const result = deriveStatusFromSource(sourceFile, targetFile);

				expect(result).toEqual(sourceFile.securityCheck);
			});
		});

		describe('WHEN source files scan status is BLOCKED', () => {
			const setup = () => {
				const { sourceFile, targetFile } = getFileRecords();

				sourceFile.securityCheck.status = ScanStatus.BLOCKED;

				return {
					sourceFile,
					targetFile,
				};
			};

			it('should keep targets securitycheck', () => {
				const { sourceFile, targetFile } = setup();

				const result = deriveStatusFromSource(sourceFile, targetFile);

				expect(result).toEqual(targetFile.securityCheck);
			});
		});

		describe('WHEN source files scan status is PENDING', () => {
			const setup = () => {
				const { sourceFile, targetFile } = getFileRecords();

				sourceFile.securityCheck.status = ScanStatus.PENDING;

				return {
					sourceFile,
					targetFile,
				};
			};

			it('should keep targets securitycheck', () => {
				const { sourceFile, targetFile } = setup();

				const result = deriveStatusFromSource(sourceFile, targetFile);

				expect(result).toEqual(targetFile.securityCheck);
			});
		});
	});

	describe('isStatusBlocked is called', () => {
		describe('WHEN file records security status is BLOCKED', () => {
			const setup = () => {
				const { sourceFile } = getFileRecords();

				sourceFile.securityCheck.status = ScanStatus.BLOCKED;

				return {
					sourceFile,
				};
			};

			it('should return true', () => {
				const { sourceFile } = setup();

				const result = isStatusBlocked(sourceFile);

				expect(result).toEqual(true);
			});
		});

		describe('WHEN file records security status is VERIFIED', () => {
			const setup = () => {
				const { sourceFile } = getFileRecords();

				sourceFile.securityCheck.status = ScanStatus.VERIFIED;

				return {
					sourceFile,
				};
			};

			it('should return true', () => {
				const { sourceFile } = setup();

				const result = isStatusBlocked(sourceFile);

				expect(result).toEqual(false);
			});
		});
	});
});
