import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import {
	Inject,
	Injectable,
	NotFoundException,
	NotImplementedException,
	UnprocessableEntityException,
} from '@nestjs/common';
import {
	GroupUsers,
	GroupfoldersCreated,
	GroupfoldersFolder,
	Meta,
	NextcloudGroups,
	OcsResponse,
	SuccessfulRes,
} from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.interface';
import { ErrorUtils } from '@src/core/error/utils';
import { LegacyLogger } from '@src/core/logger';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { parseInt } from 'lodash';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class NextcloudClient {
	private readonly baseURL: string;

	config: AxiosRequestConfig;

	constructor(
		private readonly logger: LegacyLogger,
		private readonly httpService: HttpService,
		@Inject('oidcInternalName') readonly oidcInternalName: string
	) {
		this.baseURL = Configuration.get('NEXTCLOUD_BASE_URL') as string;
		this.config = {
			auth: {
				username: Configuration.get('NEXTCLOUD_ADMIN_USER') as string,
				password: Configuration.get('NEXTCLOUD_ADMIN_PASS') as string,
			},
			headers: { 'OCS-APIRequest': true, Accept: 'Application/json' },
		};
	}

	/**
	 * Calls nextcloud to get the group id by the group name.
	 *
	 * @param groupName Name of the group in nextcloud
	 * @returns The groupId for the given groupName of the nextcloud group
	 */
	public async findGroupId(groupName: string): Promise<string> {
		const request = this.get<OcsResponse<NextcloudGroups>>(`/ocs/v1.php/cloud/groups?search=${groupName}`);

		return this.handleOcsRequest<NextcloudGroups, string>(
			request,
			(data: NextcloudGroups) => data.groups[0],
			(error) => {
				throw new NotFoundException(
					`Group ${groupName} not found in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:findGroupId')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to get the groupId for a specific schulcloud team.
	 *
	 * @param teamId Id of the schulcloud {@link TeamDto team}
	 * @returns The groupId of the given teamId in nextcloud
	 */
	public async findGroupIdByTeamId(teamId: string): Promise<string> {
		const request = this.get<OcsResponse<NextcloudGroups>>(`/ocs/v1.php/cloud/groups?search=${teamId}`);

		return this.handleOcsRequest<NextcloudGroups, string>(
			request,
			(data: NextcloudGroups) => {
				if (data.groups.length > 0) {
					return data.groups[0];
				}
				throw Error();
			},
			(error) => {
				throw new NotFoundException(
					`Group with TeamId of ${teamId} not found in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:findGroupIdByTeamId')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to create a new group.
	 *
	 * @param groupId New group id in nextcloud
	 * @param groupName New group name in nextcloud
	 */
	public createGroup(groupId: string, groupName: string): Promise<void> {
		const request = this.post<OcsResponse>(`/ocs/v1.php/cloud/groups`, {
			groupid: groupId,
			displayname: groupName,
		});

		return this.handleOcsRequest(
			request,
			() => this.logger.log(`Successfully created group with group id: ${groupId} in Nextcloud`),
			(error) => {
				throw new UnprocessableEntityException(
					`Group "${groupId}" could not be created in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:createGroup')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to delete a group.
	 *
	 * @param groupId Id of the group in nextcloud
	 */
	public deleteGroup(groupId: string): Promise<void> {
		const request = this.delete<OcsResponse<Meta>>(`/ocs/v1.php/cloud/groups/${groupId}`);

		return this.handleOcsRequest<Meta, void>(
			request,
			() => this.logger.log(`Successfully removed group with group id: ${groupId} in Nextcloud`),
			(error) => {
				throw new UnprocessableEntityException(
					`Group "${groupId}" could not be deleted in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:deleteGroup')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to rename an existing group.
	 *
	 * @param groupId Id of the group in nextcloud
	 * @param groupName New group name
	 */
	public renameGroup(groupId: string, groupName: string): Promise<void> {
		const request = this.put<OcsResponse>(`/ocs/v1.php/cloud/groups/${groupId}`, {
			key: 'displayname',
			value: groupName,
		});

		return this.handleOcsRequest(
			request,
			() => this.logger.log(`Successfully renamed group with group id: ${groupId} in Nextcloud`),
			(error) => {
				throw new UnprocessableEntityException(
					`Group "${groupId}" could not be renamed in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:renameGroup')
				);
			}
		);
	}

	/**
	 * Unused.
	 *
	 * @param groupId
	 * @param folderId
	 * @param permissions
	 */
	public setGroupPermissions(groupId: string, folderId: number, permissions: boolean[]): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/groups/${groupId}`, {
			permissions: this.boolArrToNumber(permissions),
		});

		return this.handleOcsRequest(
			request,
			() => {
				throw new NotImplementedException();
			},
			(error) => {
				throw new NotImplementedException(ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:setGroupPermission'));
			}
		);
	}

	/**
	 * Calls nextcloud to find the groupfolder id from its related group
	 *
	 * @param groupId Id of the related group in nextcloud
	 * @returns The folderId of the group in nextcloud
	 */
	public async findGroupFolderIdForGroupId(groupId: string): Promise<number> {
		const request = this.get<OcsResponse<GroupfoldersFolder[]>>(
			`/apps/schulcloud/groupfolders/folders/group/${groupId}`
		);

		return this.handleOcsRequest<GroupfoldersFolder[], number>(
			request,
			(data: GroupfoldersFolder[]) => data[0].folder_id,
			(error) => {
				throw new NotFoundException(
					`Folder for ${groupId} not found in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:findGroupFolderIdForGroupId')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to delete a groupfolder.
	 *
	 * @param folderId Id of the folder which should be deleted in nextcloud
	 */
	public deleteGroupFolder(folderId: number): Promise<void> {
		const request = this.delete<OcsResponse<SuccessfulRes>>(`/apps/groupfolders/folders/${folderId}`);

		return this.handleOcsRequest<SuccessfulRes>(
			request,
			(data: SuccessfulRes) => {
				if (data.success) {
					return this.logger.log(`Successfully deleted folder with folder id: ${folderId} in Nextcloud`);
				}
				throw Error();
			},
			(error) => {
				throw new NotFoundException(
					`Folder could not be deleted in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:deleteGroupFolder')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to create a groupfolder.
	 *
	 * @param folderName The name of the groupfolder
	 * @returns The folderId of the created groupfolder
	 */
	public createGroupFolder(folderName: string): Promise<number> {
		const request = this.post<OcsResponse<GroupfoldersCreated>>(`/apps/groupfolders/folders`, {
			mountpoint: folderName,
		});

		return this.handleOcsRequest<GroupfoldersCreated, number>(
			request,
			(data: GroupfoldersCreated) => {
				const folderId = data.id;
				this.logger.log(`Successfully created folder with folder id: ${folderId} in Nextcloud`);
				return folderId;
			},
			(error) => {
				throw new UnprocessableEntityException(
					`Groupfolder wit name "${folderName}" could not be created!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:createGroupFolder')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to give a group access to a groupfolder.
	 *
	 * @param folderId Id of the groupfolder in nextcloud
	 * @param groupId Id of the group in nextcloud
	 */
	public addAccessToGroupFolder(folderId: number, groupId: string): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/groups`, {
			group: groupId,
		});

		return this.handleOcsRequest(
			request,
			() => {
				this.logger.log(`Successfully added group: ${groupId} to folder with folder id: ${folderId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					`Group "${groupId}" could not be deleted in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:addAccessToGroupFolder')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to get all users in a group.
	 *
	 * @param groupId Id of the group in nextcloud
	 * @returns List of the nextcloud user ids
	 */
	public getGroupUsers(groupId: string): Promise<string[]> {
		const request = this.get<OcsResponse<GroupUsers>>(`/ocs/v1.php/cloud/groups/${groupId}/users`);

		return this.handleOcsRequest<GroupUsers, string[]>(
			request,
			(data: GroupUsers) => {
				this.logger.log(`Successfully fetched all users in group: ${groupId} in Nextcloud`);
				return data.users;
			},
			(error) => {
				throw new UnprocessableEntityException(
					`Could not fetch users in group: ${groupId} in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:getGroupUsers')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to add a user to a group.
	 *
	 * @param userId Id of the user in nextcloud
	 * @param groupId Id of the group in nextcloud
	 */
	public addUserToGroup(userId: string, groupId: string): Promise<void> {
		const request = this.post<OcsResponse>(`/ocs/v1.php/cloud/users/${userId}/groups`, {
			groupid: groupId,
		});

		return this.handleOcsRequest(
			request,
			() => {
				this.logger.log(`Successfully added user: ${userId} to group: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					`User: "${userId}" could not be added to group: ${groupId} in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:addUserToGroup')
				);
			}
		);
	}

	/**
	 * Calls nextcloud to remove a user from a group.
	 *
	 * @param userId Id of the user in nextcloud
	 * @param groupId Id of the group in nextcloud
	 *
	 */
	public removeUserFromGroup(userId: string, groupId: string): Promise<void> {
		const request = this.delete<OcsResponse>(`/ocs/v1.php/cloud/users/${userId}/groups?groupid=${groupId}`);

		return this.handleOcsRequest(
			request,
			() => {
				this.logger.log(`Successfully remove user: ${userId} from group: ${groupId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					`User: "${userId}" could not be removed from group: ${groupId} in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:removeUserFromGroup')
				);
			}
		);
	}

	/**
	 * Calls nexcloud to change the name of a groupfolder.
	 *
	 * @param folderId Id of the folder in nextcloud
	 * @param folderName New folder name
	 */
	public changeGroupFolderName(folderId: number, folderName: string): Promise<void> {
		const request = this.post<OcsResponse>(`/apps/groupfolders/folders/${folderId}/mountpoint`, {
			mountpoint: folderName,
		});

		return this.handleOcsRequest(
			request,
			() => {
				this.logger.log(`Successfully renamed folder with folder id: ${folderId} in Nextcloud`);
			},
			(error) => {
				throw new UnprocessableEntityException(
					`Groupfolder "${folderId}" could not be renamed in Nextcloud!`,
					ErrorUtils.createHttpExceptionOptions(error, 'NextcloudClient:changeGroupFolderName')
				);
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

	/**
	 * Creates a bitmask from an array of boolean
	 *
	 * @param arr
	 * @returns An integer bitmask
	 * @private
	 */
	private boolArrToNumber(arr: Array<boolean>): number {
		return parseInt(arr.map((r) => (r ? '1' : '0')).join(''), 2);
	}

	/**
	 * Generates a string with the oidcInternalName as a prefix for the input value.
	 *
	 * @param value
	 * @returns String of format: prefix-value
	 */
	public getNameWithPrefix(value: string): string {
		return `${this.oidcInternalName}-${value}`;
	}

	/**
	 * Helper function to handle nextcloud request for the ocs protocol.
	 *
	 * @param source observable generated from {@link HttpService}
	 * @param success function that gets called, if the {@link OcsResponse} has a {@link Meta#statuscode statuscode} of 100
	 * @param error function that gets called, if an error occurs during execution or an {@link OcsResponse} with a {@link Meta#statuscode statuscode} that is not 100
	 * @protected
	 */
	protected handleOcsRequest<T = unknown, R = void>(
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
				throw new Error(meta.statuscode.toString());
			})
			.catch((err) => {
				error(err);
				throw new NotImplementedException();
			});
	}
}
