import { MikroORM } from '@mikro-orm/core';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileRecordListResponse, FileRecordResponse, ScanResultDto, ScanResultParams } from '../controller/dto';
import { FileRecord, ScanStatus } from '../entity';
import { FileRecordMapper } from './file-record.mapper';

describe('FilesStorageMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToFileRecordResponse()', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const result = FileRecordMapper.mapToFileRecordResponse(fileRecord);
			expect(result).toEqual(
				expect.objectContaining({
					creatorId: expect.any(String),
					deletedSince: undefined,
					id: expect.any(String),
					name: 'file-record #1',
					parentId: expect.any(String),
					parentType: 'courses',
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					type: 'application/octet-stream',
				})
			);
		});
	});

	describe('mapToFileRecordListResponse()', () => {
		it('should return instance of FileRecordListResponse', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);
			expect(result).toBeInstanceOf(FileRecordListResponse);
		});
		it('should contains props [data, total, skip, limit]', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length, 0, 5);
			expect(result).toEqual(
				expect.objectContaining({
					data: expect.any(Array) as FileRecordResponse[],
					total: fileRecords.length,
					skip: 0,
					limit: 5,
				})
			);
		});
		it('should contains instances of FileRecordResponse', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result.data).toBeInstanceOf(Array);
			expect(result.data[0]).toBeInstanceOf(FileRecordResponse);
		});
	});

	describe('mapScanResultParamsToDto()', () => {
		const buildParams = (virus_detected?: boolean, virus_signature?: string, error?: string): ScanResultParams => {
			const params = {
				virus_detected,
				virus_signature,
				error,
			};

			return params;
		};

		describe('When virus was detected with signature', () => {
			const setup = () => {
				const virusSignature = 'virus-signature';
				const params = buildParams(true, virusSignature);

				return { params, virusSignature };
			};

			it('returns correct dto', () => {
				const { params, virusSignature } = setup();
				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.BLOCKED,
					reason: virusSignature,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When virus was detected without signature', () => {
			it('returns correct dto', () => {
				const params = buildParams(true);

				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.BLOCKED,
					reason: 'Virus detected',
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When scan result has error', () => {
			const setup = () => {
				const error = 'error-reason';
				const params = buildParams(undefined, undefined, error);

				return { params, error };
			};

			it('returns correct dto', () => {
				const { params, error } = setup();

				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: error,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When no virus was detected', () => {
			const setup = () => {
				const reason = 'Clean';
				const params = buildParams(false, reason);

				return { params, reason };
			};

			it('returns correct dto', () => {
				const { params, reason } = setup();

				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.VERIFIED,
					reason,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN error property contains empty string', () => {
			it('returns correct dto', () => {
				const params = buildParams(undefined, undefined, '');

				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: 'No scan result',
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN empty scanResult is passed', () => {
			it('returns correct dto', () => {
				const params = {};

				const result = FileRecordMapper.mapScanResultParamsToDto(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: 'No scan result',
				});
				expect(result).toEqual(expectedResult);
			});
		});
	});
});
