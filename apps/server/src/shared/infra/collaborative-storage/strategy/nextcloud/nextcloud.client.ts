import { Injectable, NotFoundException, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { parseInt } from 'lodash';
import { Logger } from '@src/core/logger';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	GroupfoldersCreated,
	GroupfoldersFolder,
	GroupUsers,
	Meta,
	NextcloudGroups,
	OcsResponse,
	SuccessfulRes,
} from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.interface';

function handleOcsRequest<T = unknown, R = void>(
	source: Observable<AxiosResponse<OcsResponse<T>>>,
	success: (data: T, meta: Meta) => R,
	error: (err: unknown) => void
): Promise<R> {
	return firstValueFrom(source)
		.then((resp: AxiosResponse<OcsResponse<T>>) => {
			const { data, meta } = resp.data.ocs;
			if (meta.statuscode === 100) {
				return success(data, meta);
			}
			throw Error(meta.statuscode.toString());
		})
		.catch((err) => {
			error(err);
			throw new NotImplementedException();
		});
}

@Injectable()
export class NextcloudClient {
	private readonly baseURL: string;

	private readonly oidcInternalName: string;

	config: AxiosRequestConfig;

	constructor(private readonly logger: Logger, private readonly httpService: HttpService) {
		this.baseURL = Configuration.get('NEXTCLOUD_BASE_URL') as string;
		this.oidcInternalName = Configuration.get('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME') as string;
		this.config = {
			auth: {
				username: Configuration.get('NEXTCLOUD_ADMIN_USER') as string,
				password: Configuration.get('NEXTCLOUD_ADMIN_PASS') as string,
			},
			headers: { 'OCS-APIRequest': true, Accept: 'Application/json' },
		};
	}

	public async findGroupId(groupName: string): Promise<string> {
		const request = this.get<OcsResponse<NextcloudGroups>>(`/ocs/v1.php/cloud/groups?search=${groupName}`);

		return handleOcsRequest<NextcloudGroups, string>(
			request,
			(data: NextcloudGroups) => {
				return data.groups[0];
			},
			(error) => {
				throw new NotFoundException(error, `Group ${groupName} not found in Nextcloud!`);
			}
		);
	}

	public async findGroupIdByTeamId(teamId: string): Promise<string> {
		const request = this.get<OcsResponse<NextcloudGroups>>(`/ocs/v1.php/cloud/groups?search=${teamId}`);

		return handleOcsRequest<NextcloudGroups, string>(
			request,
			(data: NextcloudGroups) => {
				if (data.groups.length > 0) {
					return data.groups[0];
				}
				throw Error();
			},
			(error) => {
				throw new NotFoundException(error, `Group with TeamId of ${teamId} not found in Nextcloud!`);
			}
		);
	}

	public createGroup(groupId: string, groupName: string): Promise<void> {
		const request = this.post<OcsResponse>(`/ocs/v1.php/cloud/groups`, {
			groupid: groupId,
			displayname: groupName,
		});

		return handleOcsRequest(
			request,
			() => {
				return this.logger.log(`Successfully created group with group id: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Group "${groupId}" could not be created in Nextcloud!`);
			}
		);
	}

	public removeGroup(groupId: string): Promise<void> {
		const request = this.delete<OcsResponse<Meta>>(`/ocs/v1.php/cloud/groups/${groupId}`);

		return handleOcsRequest<Meta, void>(
			request,
			(meta: Meta) => {
				if (meta.statuscode === 100) {
					return this.logger.log(`Successfully removed group with group id: ${groupId} in Nextcloud`);
				}
				throw Error();
			},
			(error) => {
				throw new NotFoundException(error, `Group "${groupId}" could not be deleted in Nextcloud!`);
			}
		);
	}

	public renameGroup(groupId: string, groupName: string): Promise<void> {
		const request = this.put<OcsResponse>(`/ocs/v1.php/cloud/groups/${groupId}`, {
			key: 'displayname',
			value: groupName,
		});

		return handleOcsRequest(
			request,
			() => {
				return this.logger.log(`Successfully renamed group with group id: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Group "${groupId}" could not be renamed in Nextcloud!`);
			}
		);
	}

	// TODO do we still need this, if we use teamIdToGroupId
	public async findGroupFolderIdForGroupId(groupId: string): Promise<number> {
		const request = this.get<OcsResponse<GroupfoldersFolder[]>>(
			`/apps/schulcloud/groupfolders/folders/group/${groupId}`
		);

		return handleOcsRequest<GroupfoldersFolder[], number>(
			request,
			(data: GroupfoldersFolder[]) => {
				return data[0].folder_id;
			},
			(error) => {
				throw new NotFoundException(error, `Folder for ${groupId} not found in Nextcloud!`);
			}
		);
	}

	public deleteGroupFolder(folderId: number): Promise<void> {
		const request = this.delete<OcsResponse<SuccessfulRes>>(`/apps/groupfolders/folders/${folderId}`);

		return handleOcsRequest<SuccessfulRes>(
			request,
			(data: SuccessfulRes) => {
				if (data.success) {
					return this.logger.log(`Successfully deleted folder with folder id: ${folderId} in Nextcloud`);
				}
				throw Error();
			},
			(error) => {
				throw new NotFoundException(error, `Folder could not be deleted in Nextcloud!`);
			}
		);
	}

	public setGroupPermissions(groupId: string, folderId: number, permissions: boolean[]): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/groups/${groupId}`, {
			permissions: this.boolArrToNumber(permissions),
		});

		return handleOcsRequest(
			request,
			() => {
				throw new NotImplementedException();
			},
			(error) => {
				throw new NotImplementedException(error);
			}
		);
	}

	public createGroupFolder(folderName: string): Promise<number> {
		const request = this.post<OcsResponse<GroupfoldersCreated>>(`/apps/groupfolders/folders`, {
			mountpoint: folderName,
		});

		return handleOcsRequest<GroupfoldersCreated, number>(
			request,
			(data: GroupfoldersCreated) => {
				const folderId = data.id;
				this.logger.log(`Successfully created folder with folder id: ${folderId} in Nextcloud`);
				return folderId;
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Groupfolder wit name "${folderName}" could not be created!`);
			}
		);
	}

	/**
	 *
	 * @param folderId
	 * @param groupId
	 */
	public addAccessToGroupFolder(folderId: number, groupId: string): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/groups`, {
			group: groupId,
		});

		return handleOcsRequest(
			request,
			() => {
				this.logger.log(`Successfully added group: ${groupId} to folder with folder id: ${folderId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Group "${groupId}" could not be deleted in Nextcloud!`);
			}
		);
	}

	public getGroupUsers(groupId: string): Promise<string[]> {
		const request = this.get<OcsResponse<GroupUsers>>(`/ocs/v1.php/cloud/groups/${groupId}/users`);

		return handleOcsRequest<GroupUsers, string[]>(
			request,
			(data: GroupUsers) => {
				this.logger.log(`Successfully fetched all users in group: ${groupId} in Nextcloud`);
				return data.users;
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Could not fetch users in group: ${groupId} in Nextcloud!`);
			}
		);
	}

	public addUserToGroup(userId: string, groupId: string): Promise<void> {
		const request = this.post<OcsResponse>(`/ocs/v1.php/cloud/users/${userId}/groups`, {
			groupid: groupId,
		});

		return handleOcsRequest<unknown, void>(
			request,
			() => {
				this.logger.log(`Successfully added user: ${userId} to group: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					error,
					`User: "${userId}" could not be added to group: ${groupId} in Nextcloud!`
				);
			}
		);
	}

	public removeUserFromGroup(userId: string, groupId: string): Promise<void> {
		const request = this.delete<OcsResponse>(`/ocs/v1.php/cloud/users/${userId}/groups?groupid=${groupId}`);

		return handleOcsRequest<unknown, void>(
			request,
			() => {
				this.logger.log(`Successfully remove user: ${userId} from group: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					error,
					`User: "${userId}" could not be removed from group: ${groupId} in Nextcloud!`
				);
			}
		);
	}

	public changeGroupFolderName(folderId: number, folderName: string): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/mountpoint`, {
			mountpoint: folderName,
		});

		return handleOcsRequest<unknown /* resp: AxiosResponse<OcsResponse<SuccessfulRes>> */, void>(
			request,
			() => {
				this.logger.log(`Successfully renamed folder with folder id: ${folderId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(error, `Groupfolder "${folderId}" could not be renamed in Nextcloud!`);
			}
		);
	}

	private get<T = unknown>(apiPath: string): Observable<AxiosResponse<T>> {
		return this.httpService.get<T>(`${this.baseURL}${apiPath}`, this.config);
	}

	private post<T = unknown>(apiPath: string, data: unknown): Observable<AxiosResponse<T>> {
		return this.httpService.post<T>(`${this.baseURL}${apiPath}`, data, this.config);
	}

	private put<T = unknown>(apiPath: string, data: unknown): Observable<AxiosResponse<T>> {
		return this.httpService.put<T>(`${this.baseURL}${apiPath}`, data, this.config);
	}

	private delete<T = unknown>(apiPath: string): Observable<AxiosResponse<T>> {
		return this.httpService.delete<T>(`${this.baseURL}${apiPath}`, this.config);
	}

	private boolArrToNumber(arr: Array<boolean>): number {
		return parseInt(arr.map((r) => (r ? '1' : '0')).join(''), 2);
	}

	public getNameWithPrefix(teamId: string): string {
		return `${this.oidcInternalName}-${teamId}`;
	}
}
