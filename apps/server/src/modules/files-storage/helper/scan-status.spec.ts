import { fileRecordFactory } from '@shared/testing';
import { deriveStatusFromSource } from '.';
import { ScanStatus } from '../entity';

describe('Scan Status Helper', () => {
	const getFileRecords = () => {
		const sourceFile = fileRecordFactory.build();
		const targetFile = fileRecordFactory.build();

		return { sourceFile, targetFile };
	};

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
});
