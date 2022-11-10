import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ErrorType } from '../error';
import {
	FileRecordParentType,
	ScanStatus,
	FileRecord,
	FileSecurityCheck,
	IFileRecordProperties,
} from './filerecord.entity';

describe('FileRecord Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when creating a new instance using the constructor', () => {
		let props: IFileRecordProperties;

		beforeEach(() => {
			props = {
				size: Math.round(Math.random() * 100000),
				name: `file-record #1`,
				mimeType: 'application/octet-stream',
				parentType: FileRecordParentType.Course,
				parentId: new ObjectId(),
				creatorId: new ObjectId(),
				schoolId: new ObjectId(),
			};
		});

		it('should provide the target id as entity id', () => {
			const parentId = new ObjectId();
			const fileRecord = new FileRecord({
				...props,
				parentId,
			});
			expect(fileRecord.parentId).toEqual(parentId.toHexString());
		});

		it('should provide the creator id as entity id', () => {
			const creatorId = new ObjectId();
			const fileRecord = new FileRecord({
				...props,
				creatorId,
			});
			expect(fileRecord.creatorId).toEqual(creatorId.toHexString());
		});

		it('should provide the school id as entity id', () => {
			const schoolId = new ObjectId();
			const fileRecord = new FileRecord({
				...props,
				schoolId,
			});
			expect(fileRecord.schoolId).toEqual(schoolId.toHexString());
		});

		it('should provide the lockedFor user id as entity id', () => {
			const lockedForUserId = new ObjectId();
			const fileRecord = new FileRecord({
				...props,
				lockedForUserId,
			});
			expect(fileRecord.lockedForUserId).toEqual(lockedForUserId.toHexString());
		});
	});

	describe('when embedding the security status', () => {
		it('should set the embedded status property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, '');
			expect(fileRecord.securityCheck?.status).toEqual(ScanStatus.VERIFIED);
		});

		it('should set the embedded reason property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.reason).toEqual('scanned');
		});

		it('should set the embedded requestToken property', () => {
			const fileRecord = fileRecordFactory.build();
			//	fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.requestToken).toBeDefined();
		});

		it('should set to `undifined` the embedded requestToken property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.requestToken).toBeUndefined();
		});
	});

	describe('FileSecurityCheck', () => {
		it('should set the requestToken via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ requestToken: '08154711' });
			expect(securityCheck.requestToken).toEqual('08154711');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the status via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ status: ScanStatus.PENDING });
			expect(securityCheck.status).toEqual(ScanStatus.PENDING);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the reason via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ reason: 'test-reason' });
			expect(securityCheck.reason).toEqual('test-reason');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
		});
	});

	describe('setName is called', () => {
		describe('WHEN new name has length > 0', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();
				const newName = 'newName';

				return { fileRecord, newName };
			};

			it('should set name', () => {
				const { fileRecord, newName } = setup();

				fileRecord.setName(newName);

				expect(fileRecord.name).toBe(newName);
			});
		});

		describe('WHEN new name is empty string', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();
				const newName = '';

				return { fileRecord, newName };
			};

			it('should throw error and not set name', () => {
				const { fileRecord, newName } = setup();
				const error = new BadRequestException(ErrorType.FILE_NAME_EMPTY);

				expect(() => {
					fileRecord.setName(newName);
				}).toThrow(error);
				expect(fileRecord.name).not.toBe(newName);
			});
		});
	});
});
