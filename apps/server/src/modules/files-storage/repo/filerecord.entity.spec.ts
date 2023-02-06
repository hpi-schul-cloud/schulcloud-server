import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@shared/testing';
import { FileRecordParentType, ScanStatus } from '../domain';
import { FileRecordEntity, FileSecurityCheck, IFileRecordProperties } from './filerecord.entity';

describe('FileRecord Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecordEntity]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when creating a new instance using the constructor', () => {
		const setup = () => {
			const props: IFileRecordProperties = {
				size: Math.round(Math.random() * 100000),
				name: `file-record #1`,
				mimeType: 'application/octet-stream',
				parentType: FileRecordParentType.Course,
				parentId: new ObjectId(),
				creatorId: new ObjectId(),
				schoolId: new ObjectId(),
			};

			return { props };
		};

		it('should provide the target id as entity id', () => {
			const { props } = setup();
			const parentId = new ObjectId();
			const fileRecord = new FileRecordEntity({
				...props,
				parentId,
			});
			expect(fileRecord.parentId).toEqual(parentId.toHexString());
		});

		it('should provide the creator id as entity id', () => {
			const { props } = setup();
			const creatorId = new ObjectId();
			const fileRecord = new FileRecordEntity({
				...props,
				creatorId,
			});
			expect(fileRecord.creatorId).toEqual(creatorId.toHexString());
		});

		it('should provide the school id as entity id', () => {
			const { props } = setup();
			const schoolId = new ObjectId();
			const fileRecord = new FileRecordEntity({
				...props,
				schoolId,
			});
			expect(fileRecord.schoolId).toEqual(schoolId.toHexString());
		});

		it.skip('should provide the lockedFor user id as entity id', () => {
			const { props } = setup();
			const lockedForUserId = new ObjectId();
			const fileRecord = new FileRecordEntity({
				...props,
				lockedForUserId,
			});
			expect(fileRecord.lockedForUserId).toEqual(lockedForUserId.toHexString());
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
});
