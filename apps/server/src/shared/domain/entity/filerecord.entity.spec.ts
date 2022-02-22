import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileRecordParentType, ScanStatus } from '.';
import { IFileRecordProperties, FileRecord, FileSecurityCheck } from './filerecord.entity';

describe('FileRecord Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
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

	describe('when updating the security status', () => {
		it('should create a status object if not exists', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.WONT_CHECK, 'irrelevant');
			expect(fileRecord.securityCheck).toBeDefined();
		});

		it('should set status and reason properties on the embedded object', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.WONT_CHECK, 'irrelevant');
			expect(fileRecord.securityCheck?.status).toEqual(ScanStatus.WONT_CHECK);
			expect(fileRecord.securityCheck?.reason).toEqual('irrelevant');
		});
	});

	describe('FileSecurityCheck', () => {
		it('should set the requestToken via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ requestToken: '08154711' });
			expect(securityCheck.requestToken).toEqual('08154711');
		});
	});
});
