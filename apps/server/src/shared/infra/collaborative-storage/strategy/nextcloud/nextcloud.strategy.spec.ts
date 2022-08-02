import { Test, TestingModule } from '@nestjs/testing';
import {
	GroupfoldersFolder,
	Meta,
	NextcloudGroups,
	NextcloudStrategy,
	OcsResponse,
	SuccessfulRes,
} from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';

const createAxiosResponse = (
	data: OcsResponse<NextcloudGroups | GroupfoldersFolder[] | SuccessfulRes | []> | Record<string, unknown>
): AxiosResponse<
	OcsResponse<NextcloudGroups | GroupfoldersFolder[] | SuccessfulRes | []> | OcsResponse<Meta> | Record<string, unknown>
> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

const createOcsResponse = (
	data: NextcloudGroups | GroupfoldersFolder[] | SuccessfulRes | [],
	meta?: Meta
): OcsResponse<NextcloudGroups | GroupfoldersFolder[] | SuccessfulRes | []> => ({ ocs: { data, meta } });

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategy;

	let httpService: DeepMocked<HttpService>;

	const groupfoldersFolders: GroupfoldersFolder[] = [{ folder_id: 'testFolderId' }];
	const nextcloudGroups: NextcloudGroups = { groups: ['testGroupId'] };

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NextcloudStrategy,
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
		strategy = module.get(NextcloudStrategy);
		httpService = module.get(HttpService);
	});

	describe('Update TeamPermissions For Role', () => {
		beforeEach(() => {
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('folders/group/testGroupId')) {
					resp.data = createOcsResponse(groupfoldersFolders);
				}
				if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
				return of(resp);
			});
			httpService.post.mockImplementation((): Observable<AxiosResponse> => {
				return of(createAxiosResponse(createOcsResponse({ groups: [] })));
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
			expect(httpService.get).toBeCalledTimes(2);
			expect(httpService.post).toBeCalledTimes(1);
		});

		it('should not find the group and throw a NotFoundException', async () => {
			httpService.get.mockImplementation((): Observable<AxiosResponse> => {
				return of(createAxiosResponse({}));
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
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('groupfolders/folders')) {
					resp.data = [];
				}
				if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
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

	const teamIdMock = 'teamIdMock';
	describe('Delete Team from Nextcloud', () => {
		beforeEach(() => {
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('cloud/groups?search=teamIdMock')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
				if (url.endsWith('cloud/groups?search=teamIdNoGroups')) {
					resp.data = createOcsResponse({ groups: [] });
				}
				if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
					resp.data = createOcsResponse(groupfoldersFolders);
				}
				return of(resp);
			});
			httpService.delete.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('/groups/testGroupId')) {
					resp.data = createOcsResponse([], { statuscode: 100 });
				}
				if (url.endsWith('/groupfolders/folders/testFolderId')) {
					resp.data = createOcsResponse({ success: true });
				}
				return of(resp);
			});
		});

		afterEach(() => {
			jest.clearAllMocks();
			jest.resetAllMocks();
		});

		it('should remove the groups and delete the groupfolder ', async () => {
			await strategy.deleteTeam(teamIdMock);
			expect(httpService.get).toBeCalledTimes(2);
			expect(httpService.delete).toBeCalledTimes(2);
		});

		it('should throw a NotFoundException when folderId is not found', async () => {
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('groupfolders/folders')) {
					resp.data = {};
				}
				if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
				return of(resp);
			});
			await expect(strategy.deleteTeam(teamIdMock)).rejects.toThrow(NotFoundException);
		});

		it('should throw a NotFoundException when groupId is not found', async () => {
			jest.resetAllMocks();
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('cloud/groups?search=teamIdNoGroups')) {
					resp.data = createOcsResponse({ groups: [] });
				}
				return of(resp);
			});
			await expect(strategy.deleteTeam('teamIdNoGroups')).rejects.toThrowError();
			await expect(strategy.deleteTeam('teamIdNoGroups')).rejects.toThrow(NotFoundException);
		});

		it('should throw a NotFoundException when group could not be removed', async () => {
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('cloud/groups?search=teamIdMock')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
				if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
					resp.data = createOcsResponse(groupfoldersFolders);
				}
				return of(resp);
			});
			httpService.delete.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('/groups/testGroupId')) {
					resp.data = createOcsResponse([], { statuscode: 101 });
				}
				if (url.endsWith('/groupfolders/folders/testFolderId')) {
					resp.data = createOcsResponse({ success: true });
				}
				return of(resp);
			});
			await expect(strategy.deleteTeam(teamIdMock)).rejects.toThrowError();
			await expect(strategy.deleteTeam(teamIdMock)).rejects.toThrow(NotFoundException);
		});

		it.skip('should throw a NotFoundException when folder could not be deleted', async () => {
			httpService.get.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('cloud/groups?search=teamIdMock')) {
					resp.data = createOcsResponse(nextcloudGroups);
				}
				if (url.endsWith('apps/schulcloud/groupfolders/folders/group/testGroupId')) {
					resp.data = createOcsResponse(groupfoldersFolders);
				}
				return of(resp);
			});
			httpService.delete.mockImplementation((url: string): Observable<AxiosResponse> => {
				const resp: AxiosResponse = createAxiosResponse({});
				if (url.endsWith('/groups/testGroupId')) {
					resp.data = createOcsResponse([], { statuscode: 100 });
				}
				if (url.endsWith('/groupfolders/folders/testFolderId')) {
					resp.data = createOcsResponse([]);
				}
				return of(resp);
			});
			await expect(strategy.deleteTeam(teamIdMock)).rejects.toThrow(NotFoundException);
		});
	});
});
