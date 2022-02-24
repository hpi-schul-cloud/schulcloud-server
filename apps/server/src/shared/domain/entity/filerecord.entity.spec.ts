import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileSecurityCheckStatus } from '.';
import { IFileRecordProperties, FileRecord, FileRecordTargetType, FileSecurityCheck } from './filerecord.entity';

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
				type: 'application/octet-stream',
				securityCheck: new FileSecurityCheck({}),
				targetType: FileRecordTargetType.Course,
				targetId: new ObjectId(),
				creatorId: new ObjectId(),
				schoolId: new ObjectId(),
			};
		});

		it('should provide the target id as entity id', () => {
			const targetId = new ObjectId();
			const fileRecord = new FileRecord({
				...props,
				targetId,
			});
			expect(fileRecord.targetId).toEqual(targetId.toHexString());
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
			const fileRecord = fileRecordFactory.build({ securityCheck: { status: FileSecurityCheckStatus.VERIFIED } });
			expect(fileRecord.securityCheck?.status).toEqual(FileSecurityCheckStatus.VERIFIED);
		});

		it('should set the embedded reason property', () => {
			const fileRecord = fileRecordFactory.build({ securityCheck: { reason: 'scanned' } });
			expect(fileRecord.securityCheck?.reason).toEqual('scanned');
		});

		it('should set the embedded requestToken property', () => {
			const fileRecord = fileRecordFactory.build({ securityCheck: { requestToken: '08154711' } });
			expect(fileRecord.securityCheck?.requestToken).toEqual('08154711');
		});
	});

	describe('when updating the security status', () => {
		it('should create a status object if not exists', () => {
			const fileRecord = fileRecordFactory.build({ securityCheck: undefined });
			fileRecord.updateSecurityCheckStatus(FileSecurityCheckStatus.WONTCHECK, 'irrelevant');
			expect(fileRecord.securityCheck).toBeDefined();
		});

		it('should set status and reason properties on the embedded object', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(FileSecurityCheckStatus.WONTCHECK, 'irrelevant');
			expect(fileRecord.securityCheck?.status).toEqual(FileSecurityCheckStatus.WONTCHECK);
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
