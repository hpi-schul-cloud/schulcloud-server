import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { NotFoundException, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	GroupfoldersCreated,
	GroupfoldersFolder,
	GroupUsers,
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

function createAxiosResponse<T = unknown>(data: T): AxiosResponse<T> {
	return {
		data,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};
}

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
	let logger: DeepMocked<Logger>;

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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		client = module.get(NextcloudClientSpec);
		httpService = module.get(HttpService);
		logger = module.get(Logger);
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
			// Arrange
			const groupId = testGroupId;
			httpService.get.mockReturnValue(
				createObservable(
					createOcsResponse<NextcloudGroups>({
						groups: [groupId],
					})
				)
			);

			// Act
			const result: string = await client.findGroupId(testGroupName);

			// Assert
			expect(result).toEqual(groupId);
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.findGroupId(testGroupName)).rejects.toThrow(NotFoundException);
		});
	});

	describe('findGroupIdByTeamId', () => {
		it('should find group id', async () => {
			// Arrange
			const groupId = testGroupId;
			httpService.get.mockReturnValue(
				createObservable(
					createOcsResponse<NextcloudGroups>({
						groups: [groupId],
					})
				)
			);

			// Act
			const result: string = await client.findGroupIdByTeamId('teamId');

			// Assert
			expect(result).toEqual(groupId);
		});

		it('should throw on empty group list', async () => {
			// Arrange
			httpService.get.mockReturnValue(createObservable(createOcsResponse<NextcloudGroups>({ groups: [] })));

			// Act & Assert
			await expect(client.findGroupIdByTeamId('teamId')).rejects.toThrow(NotFoundException);
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.findGroupIdByTeamId('teamId')).rejects.toThrow(NotFoundException);
		});
	});

	describe('createGroup', () => {
		it('should create group', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.createGroup(testGroupId, testGroupName);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.createGroup(testGroupId, testGroupName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('deleteGroup', () => {
		it('should delete group', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.deleteGroup(testGroupId);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.deleteGroup(testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('renameGroup', () => {
		it('should rename group', async () => {
			// Arrange
			httpService.put.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.renameGroup(testGroupId, testGroupName);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.put.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.renameGroup(testGroupId, testGroupName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('setGroupPermissions', () => {
		it('should always throw', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			// Act & Assert
			await expect(
				client.setGroupPermissions(testGroupId, testFolderId, [true, true, true, true, true])
			).rejects.toThrow(NotImplementedException);
		});
	});

	describe('findGroupFolderIdForGroupId', () => {
		it('should find group folder', async () => {
			// Arrange
			httpService.get.mockReturnValue(
				createObservable(createOcsResponse<GroupfoldersFolder[]>([{ folder_id: testFolderId }]))
			);

			// Act
			const result: number = await client.findGroupFolderIdForGroupId(testGroupId);

			// Assert
			expect(result).toEqual(testFolderId);
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.findGroupFolderIdForGroupId(testGroupId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteGroupFolder', () => {
		it('should delete group folder', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse<SuccessfulRes>({ success: true })));

			// Act
			await client.deleteGroupFolder(testFolderId);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw when not successful', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse<SuccessfulRes>({ success: false })));

			// Act & Assert
			await expect(client.deleteGroupFolder(testFolderId)).rejects.toThrow(NotFoundException);
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.deleteGroupFolder(testFolderId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('createGroupFolder', () => {
		it('should create group folder', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse<GroupfoldersCreated>({ id: testFolderId })));

			// Act
			const result: number = await client.createGroupFolder(testFolderName);

			// Assert
			expect(result).toEqual(testFolderId);
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.createGroupFolder(testFolderName)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('addAccessToGroupFolder', () => {
		it('should add group access to group folder', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.addAccessToGroupFolder(testFolderId, testGroupId);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.addAccessToGroupFolder(testFolderId, testGroupId)).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getGroupUsers', () => {
		it('should get user ids in group', async () => {
			// Arrange
			const users = ['user1Id', 'user2Id'];
			httpService.get.mockReturnValue(createObservable(createOcsResponse<GroupUsers>({ users })));

			// Act
			const result: string[] = await client.getGroupUsers(testGroupId);

			// Assert
			expect(result).toEqual(users);
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.get.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.getGroupUsers(testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('addUserToGroup', () => {
		it('should add user to group', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.addUserToGroup('user1Id', testGroupId);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.addUserToGroup('user1Id', testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('removeUserFromGroup', () => {
		it('should remove user from group', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.removeUserFromGroup('user1Id', testGroupId);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.delete.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.removeUserFromGroup('user1Id', testGroupId)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('changeGroupFolderName', () => {
		it('should change group folder name', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([])));

			// Act
			await client.changeGroupFolderName(testFolderId, testFolderName);

			// Assert
			expect(logger.log).toHaveBeenCalled();
		});

		it('should throw on error metadata', async () => {
			// Arrange
			httpService.post.mockReturnValue(createObservable(createOcsResponse([], errorMetadata)));

			// Act & Assert
			await expect(client.changeGroupFolderName(testFolderId, testFolderName)).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getNameWithPrefix', () => {
		it('should change group folder name', () => {
			// Arrange
			const teamId = new ObjectId().toHexString();

			// Act
			const result: string = client.getNameWithPrefix(teamId);

			// Assert
			expect(result).toEqual(`${prefix}-${teamId}`);
		});
	});
});
