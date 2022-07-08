import { Test, TestingModule } from '@nestjs/testing';
import {
	GroupfoldersFolder,
	Meta,
	NextcloudGroups,
	NextcloudStrategy,
	OcsResponse,
} from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { HttpModule } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { Logger, NotFoundException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

const createAxiosResponse = function (
	data: OcsResponse<NextcloudGroups | GroupfoldersFolder> | undefined
): AxiosResponse<OcsResponse<NextcloudGroups | GroupfoldersFolder> | OcsResponse<Meta> | undefined> {
	return {
		data: data ?? undefined,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};
};

const createOcsResponse = function (
	data: NextcloudGroups | GroupfoldersFolder
): OcsResponse<NextcloudGroups | GroupfoldersFolder> {
	return { ocs: { data } };
};

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategy;

	const groupfolderFolder: GroupfoldersFolder = { folder_id: 'testFolderId' };
	const nextcloudGroups: NextcloudGroups = { groups: ['testGroupId'] };

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				NextcloudStrategy,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		strategy = module.get(NextcloudStrategy);
	});

	describe('Update TeamPermissions For Role', () => {
		beforeAll(() => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					const resp: AxiosResponse = createAxiosResponse(undefined);
					if (url.endsWith('folders/group/testGroupId')) {
						resp.data = createOcsResponse(groupfolderFolder);
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
						resp.data = createOcsResponse(nextcloudGroups);
					}
					return of(resp);
				});
			jest
				.spyOn(strategy.httpService, 'post')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, data?: never, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					return of({
						data: [],
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					});
				});
		});

		afterAll(() => {
			jest.clearAllMocks();
		});

		it('should call the setGroupPermissions method', async () => {
			await strategy.updateTeamPermissionsForRole({
				permissions: [false, true, false, true, false],
				roleName: 'RoleName',
				teamId: 'TeamId',
				teamName: 'TeamName',
			});
			expect(strategy.httpService.get).toBeCalledTimes(2);
			expect(strategy.httpService.post).toBeCalledTimes(1);
		});

		it('should not find the group and throw a NotFoundException', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					const resp: AxiosResponse = {
						data: {},
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(
				strategy.updateTeamPermissionsForRole({
					permissions: [false, false, false, false, false],
					roleName: 'RoleName',
					teamId: 'TeamId',
					teamName: 'noName',
				})
			).rejects.toThrow(NotFoundException);
		});

		it('should not find the folder and throw a NotFoundException', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('groupfolders/folders')) {
						data = { ocs: { data: {} } };
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
						data = { ocs: { data: { groups: ['testGroupId'] } } };
					}
					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(
				strategy.updateTeamPermissionsForRole({
					permissions: [false, false, false, false, false],
					roleName: 'RoleName',
					teamId: 'TeamId',
					teamName: 'TeamName',
				})
			).rejects.toThrow(NotFoundException);
		});
	});

	// """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
	const teamIdMock = 'teamIdMock';
	describe('Delete Team from Nextcloud', () => {
		beforeEach(() => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data: OcsResponse<NextcloudGroups | GroupfoldersFolder> | undefined;
					if (url.endsWith('cloud/groups?search=teamIdMock')) {
						data = createOcsResponse(nextcloudGroups);
					}
					if (url.endsWith('cloud/groups?search=teamIdNoGroups')) {
						data = createOcsResponse({ groups: [] });
					}
					if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
						data = createOcsResponse(groupfolderFolder);
					}
					return of(createAxiosResponse(data));
				});
			jest
				.spyOn(strategy.httpService, 'delete')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('/groups/testGroupId')) {
						data = { ocs: { data: [], meta: { statuscode: 100 } } };
					}
					if (url.endsWith('/groupfolders/folders/testFolderId')) {
						data = { ocs: { data: { success: true } } };
					}
					const resp: AxiosResponse = {
						data,
						status: 200,
						statusText: 'OK',
						headers: {},
						config: {},
					};
					return of(resp);
				});
		});

		afterEach(() => {
			jest.clearAllMocks();
			jest.resetAllMocks();
		});

		it('should remove the groups and delete the groupfolder ', async () => {
			// TODO Mock
			await strategy.deleteGroupfolderAndRemoveGroup(teamIdMock);
			expect(strategy.httpService.get).toBeCalledTimes(2);
			expect(strategy.httpService.delete).toBeCalledTimes(2);
		});

		it('should throw a NotFoundException when folderId is not found', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('groupfolders/folders')) {
						data = { ocs: { data: {} } };
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
						data = { ocs: { data: { groups: ['testGroupId'] } } };
					}
					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(strategy.deleteGroupfolderAndRemoveGroup(teamIdMock)).rejects.toThrow(NotFoundException);
		});

		it('should throw a NotFoundException when groupId is not found', async () => {
			jest.resetAllMocks();
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('cloud/groups?search=teamIdNoGroups')) {
						data = { ocs: { data: { groups: [] } } };
					}

					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(strategy.deleteGroupfolderAndRemoveGroup('teamIdNoGroups')).rejects.toThrowError();
			await expect(strategy.deleteGroupfolderAndRemoveGroup('teamIdNoGroups')).rejects.toThrow(NotFoundException);
		});

		it('should throw a NotFoundException when group could not be removed', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('cloud/groups?search=teamIdMock')) {
						data = { ocs: { data: { groups: ['testGroupId'] } } };
					}
					if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
						data = { ocs: { data: [{ folder_id: 'testFolderId' }] } };
					}
					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			jest
				.spyOn(strategy.httpService, 'delete')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('/groups/testGroupId')) {
						data = { ocs: { data: [], meta: { statuscode: 101 } } };
					}
					if (url.endsWith('/groupfolders/folders/testFolderId')) {
						data = { ocs: { data: { success: true } } };
					}
					const resp: AxiosResponse = {
						data,
						status: 200,
						statusText: 'OK',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(strategy.deleteGroupfolderAndRemoveGroup(teamIdMock)).rejects.toThrowError();
			await expect(strategy.deleteGroupfolderAndRemoveGroup(teamIdMock)).rejects.toThrow(NotFoundException);
		});

		it.skip('should throw a NotFoundException when folder could not be deleted', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('cloud/groups?search=teamIdMock')) {
						data = { ocs: { data: { groups: ['testGroupId'] } } };
					}
					if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
						data = { ocs: { data: [{ folder_id: 'testFolderId' }] } };
					}
					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			jest
				.spyOn(strategy.httpService, 'delete')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('/groups/testGroupId')) {
						data = { ocs: { data: [], meta: { statuscode: 100 } } };
					}
					if (url.endsWith('/groupfolders/folders/testFolderId')) {
						data = { ocs: { data: {} } };
					}
					const resp: AxiosResponse = {
						data,
						status: 200,
						statusText: 'OK',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(strategy.deleteGroupfolderAndRemoveGroup(teamIdMock)).rejects.toThrow(NotFoundException);
		});
	});
});
