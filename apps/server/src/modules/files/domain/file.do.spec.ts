import { File } from './file.do';
import { FileSecurityCheck } from './file-security-check.do';
import { FileSecurityCheckStatus, FileOwnerModel, FilePermissionReferenceModel } from './types';
import { FilePermission } from './file-permission.do';

describe(File.name, () => {
	const setup = () => {
		const props = {
			id: '8bd8456a-afcd-435d-a9cf-1ddc675c2a55',
			createdAt: new Date(2023, 8, 1),
			updatedAt: new Date(2023, 8, 15),
			deletedAt: new Date(2023, 9, 1),
			deleted: true,

			// This value should be false of course (as it's just some plain text file),
			// but to verify returning proper value from the getter it's set to true.
			isDirectory: true,

			name: 'test-file-1.txt',
			size: 42,
			type: 'text/plain',
			storageFileName: '001-test-file-1.txt',
			bucket: 'bucket-001',
			storageProviderId: '3650997d-88ec-48e6-8893-feb0c7e3634a',
			thumbnail: 'https://example.com/thumbnail.png',
			thumbnailRequestToken: '5851bc82-4d99-4778-a6a1-608920975da6',
			securityCheck: new FileSecurityCheck({
				createdAt: new Date(2023, 8, 1, 0, 0, 15),
				updatedAt: new Date(2023, 8, 1, 0, 0, 42),
				status: FileSecurityCheckStatus.VERIFIED,
				reason: 'AV scanning done',
				requestToken: '9bbde706-9297-46a4-8082-24535e25824b',
			}),
			shareTokens: [
				'5f2737c3-4062-44c4-a0d3-8421cd33a512',
				'a23f9039-bc72-4a4a-afc6-8a77f7bf7090',
				'9cec5614-ae2d-42ae-9dd5-0f77c7e8901f',
			],
			parentId: '52d910af-1073-4159-b8fa-271c68a616da',
			ownerId: 'a3b67373-56ee-4cd0-b75a-ceb03ec395bd',
			ownerModel: FileOwnerModel.USER,
			creatorId: '67928568-a5e9-4179-8e30-0499033ac25d',
			permissions: [
				new FilePermission({
					referenceId: 'a4dd7b99-6acb-4c9e-9864-07a6920e0840',
					referenceModel: FilePermissionReferenceModel.USER,
					readPermission: true,
					writePermission: true,
					createPermission: true,
					deletePermission: true,
				}),
				new FilePermission({
					referenceId: '299e7a2b-ceb7-4cda-ae94-01eb6117979e',
					referenceModel: FilePermissionReferenceModel.USER,
					readPermission: true,
					writePermission: true,
					createPermission: true,
					deletePermission: true,
				}),
				new FilePermission({
					referenceId: '9d88678e-0bc6-4cfe-bfcf-1c1b2b43a096',
					referenceModel: FilePermissionReferenceModel.ROLE,
					readPermission: true,
					writePermission: true,
					createPermission: true,
					deletePermission: true,
				}),
			],
			lockId: 'bb3a21db-c70e-4c1d-8e08-9230fa423c85',
		};

		const domainObject = new File(props);

		return { props, domainObject };
	};

	describe('getProps', () => {
		it('should return proper copy of the props object', () => {
			const { props, domainObject } = setup();

			const doProps = domainObject.getProps();

			expect(doProps).toEqual(props);

			// Verify if the returned props object is an actual
			// (deep) copy and not just the original props object.
			expect(doProps === props).toEqual(false);
			expect(doProps.createdAt === props.createdAt).toEqual(false);
			expect(doProps.updatedAt === props.updatedAt).toEqual(false);
			expect(doProps.deletedAt === props.deletedAt).toEqual(false);
			expect(doProps.securityCheck === props.securityCheck).toEqual(false);
			expect(doProps.shareTokens === props.shareTokens).toEqual(false);
			expect(doProps.permissions === props.permissions).toEqual(false);
		});
	});

	describe('getters', () => {
		it('getters should return proper values from the props passed via constructor', () => {
			const { props, domainObject } = setup();

			const gettersValues = {
				id: domainObject.id,
				createdAt: domainObject.createdAt,
				updatedAt: domainObject.updatedAt,
				deletedAt: domainObject.deletedAt,
				deleted: domainObject.deleted,
				isDirectory: domainObject.isDirectory,
				name: domainObject.name,
				size: domainObject.size,
				type: domainObject.type,
				storageFileName: domainObject.storageFileName,
				bucket: domainObject.bucket,
				storageProviderId: domainObject.storageProviderId,
				thumbnail: domainObject.thumbnail,
				thumbnailRequestToken: domainObject.thumbnailRequestToken,
				securityCheck: domainObject.securityCheck,
				shareTokens: domainObject.shareTokens,
				parentId: domainObject.parentId,
				ownerId: domainObject.ownerId,
				ownerModel: domainObject.ownerModel,
				creatorId: domainObject.creatorId,
				permissions: domainObject.permissions,
				lockId: domainObject.lockId,
			};

			expect(gettersValues).toEqual(props);
		});
	});
});
