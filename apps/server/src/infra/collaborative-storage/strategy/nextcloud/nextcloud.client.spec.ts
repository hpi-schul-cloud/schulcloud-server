import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { NotFoundException, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { NextcloudClient } from './nextcloud.client';
import {
	GroupUsers,
	GroupfoldersCreated,
	GroupfoldersFolder,
	Meta,
	NextcloudGroups,
	OcsResponse,
	SuccessfulRes,
} from './nextcloud.interface';

const defaultMetadata: Meta = {
	status: 'ok',
	itemsperpage: '',
	message: 'Ok',
	statuscode: 100,
	totalitems: '',
};

const errorMetadata: Meta = {
	status: 'fail',
	itemsperpage: '',
	message: 'Fail',
	statuscode: 101,
	totalitems: '',
};

function createOcsResponse<T = unknown>(data: T, meta: Meta = defaultMetadata): OcsResponse<T> {
	return {
		ocs: {
			data,
			meta,
		},
	};
}

const createAxiosResponse = (data: unknown) =>
	axiosResponseFactory.build({
		data,
	});

function createObservable<T = unknown>(data: T): Observable<AxiosResponse<T>> {
	return of(createAxiosResponse(data));
}

class NextcloudClientSpec extends NextcloudClient {
	handleOcsRequestSpec<T = unknown, R = void>(
		source: Observable<AxiosResponse<OcsResponse<T>>>,
		success: (data: T, meta: Meta) => R,
		error: (err: unknown) => void
	): Promise<R> {
		return this.handleOcsRequest(source, success, error);
	}
}

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let client: NextcloudClientSpec;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<LegacyLogger>;

	const testGroupId = 'group1Id';
	const testGroupName = 'group1DisplayName';
	const testFolderId = 12345;
	const testFolderName = 'folder1Name';
	const prefix = 'prefix';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NextcloudClientSpec,
				{
					provide: 'oidcInternalName',
					useValue: prefix,
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		client = module.get(NextcloudClientSpec);
		httpService = module.get(HttpService);
		logger = module.get(LegacyLogger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('handleOcsRequest', () => {
		it('should throw not implemented', async () => {
			await expect(
				client.handleOcsRequestSpec(
					createObservable(createOcsResponse(undefined)),
					() => {
						throw new Error();
					},
					() => {
						// No return here
					}
				)
			).rejects.toThrow(NotImplementedException);
		});
	});

	describe('findGroupId', () => {
		it('should find group id', async () => {
			const groupId = testGroupId;
			httpService.get.mockReturnValue(
				createObservable(
					createOcsResponse<NextcloudGroups>({
						groups: [groupId],
					})
				)
			);

			const result: string = await client.findGroupId(testGroupName);

			expect(result).toEqual(groupId);
		});

		it('should throw on error metadata', async () => {
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.findGroupId(testGroupName)).rejects.toThrow(NotFoundException);
		});
	});

	describe('findGroupIdByTeamId', () => {
		it('should find group id', async () => {
			const groupId = testGroupId;
			httpService.get.mockReturnValue(
				createObservable(
					createOcsResponse<NextcloudGroups>({
						groups: [groupId],
					})
				)
			);

			const result: string = await client.findGroupIdByTeamId('teamId');

			expect(result).toEqual(groupId);
		});

		it('should throw on empty group list', async () => {
			httpService.get.mockReturnValue(createObservable(createOcsResponse<NextcloudGroups>({ groups: [] })));

			await expect(client.findGroupIdByTeamId('teamId')).rejects.toThrow(NotFoundException);
		});

		it('should throw on error metadata', async () => {
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.findGroupIdByTeamId('teamId')).rejects.toThrow(NotFoundException);
		});
	});

	describe('createGroup', () => {
		it('should create group', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			await client.createGroup(testGroupId, testGroupName);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.createGroup(testGroupId, testGroupName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('deleteGroup', () => {
		it('should delete group', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([])));

			await client.deleteGroup(testGroupId);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.deleteGroup(testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('renameGroup', () => {
		it('should rename group', async () => {
			httpService.put.mockReturnValue(createObservable(createOcsResponse([])));

			await client.renameGroup(testGroupId, testGroupName);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.put.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.renameGroup(testGroupId, testGroupName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('setGroupPermissions', () => {
		it('should always throw', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			await expect(
				client.setGroupPermissions(testGroupId, testFolderId, [true, false, true, true, false])
			).rejects.toThrow(NotImplementedException);
		});
	});

	describe('findGroupFolderIdForGroupId', () => {
		it('should find group folder', async () => {
			httpService.get.mockReturnValue(
				createObservable(createOcsResponse<GroupfoldersFolder[]>([{ folder_id: testFolderId }]))
			);

			const result: number = await client.findGroupFolderIdForGroupId(testGroupId);

			expect(result).toEqual(testFolderId);
		});

		it('should throw on error metadata', async () => {
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.findGroupFolderIdForGroupId(testGroupId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteGroupFolder', () => {
		it('should delete group folder', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse<SuccessfulRes>({ success: true })));

			await client.deleteGroupFolder(testFolderId);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw when not successful', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse<SuccessfulRes>({ success: false })));

			await expect(client.deleteGroupFolder(testFolderId)).rejects.toThrow(NotFoundException);
		});

		it('should throw on error metadata', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.deleteGroupFolder(testFolderId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('createGroupFolder', () => {
		it('should create group folder', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse<GroupfoldersCreated>({ id: testFolderId })));

			const result: number = await client.createGroupFolder(testFolderName);

			expect(result).toEqual(testFolderId);
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.createGroupFolder(testFolderName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('addAccessToGroupFolder', () => {
		it('should add group access to group folder', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			await client.addAccessToGroupFolder(testFolderId, testGroupId);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.addAccessToGroupFolder(testFolderId, testGroupId)).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getGroupUsers', () => {
		it('should get user ids in group', async () => {
			const users = ['user1Id', 'user2Id'];
			httpService.get.mockReturnValue(createObservable(createOcsResponse<GroupUsers>({ users })));

			const result: string[] = await client.getGroupUsers(testGroupId);

			expect(result).toEqual(users);
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.getGroupUsers(testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('addUserToGroup', () => {
		it('should add user to group', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			await client.addUserToGroup('user1Id', testGroupId);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.addUserToGroup('user1Id', testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('removeUserFromGroup', () => {
		it('should remove user from group', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([])));

			await client.removeUserFromGroup('user1Id', testGroupId);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.removeUserFromGroup('user1Id', testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('changeGroupFolderName', () => {
		it('should change group folder name', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			await client.changeGroupFolderName(testFolderId, testFolderName);

			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			await expect(client.changeGroupFolderName(testFolderId, testFolderName)).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getNameWithPrefix', () => {
		it('should change group folder name', () => {
			const teamId = new ObjectId().toHexString();

			const result: string = client.getNameWithPrefix(teamId);

			expect(result).toEqual(`${prefix}-${teamId}`);
		});
	});
});
