/* eslint-disable max-classes-per-file */
/* eslint-disable require-await */
/* Istanbul ignore file */
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ROCKET_CHAT_CONFIG_TOKEN, RocketChatConfig } from './rocket-chat.config';

export interface RocketChatGroupModel {
	group: {
		_id: string;
		name: string;
		fname: string;
		t: string;
		msgs: number;
		usersCount: number;
		u: {
			_id: string;
			username: string;
		};
		customfields: object;
		broadcast: boolean;
		encrypted: boolean;
		ts: Date;
		ro: boolean;
		defaults: boolean;
		sysmes: boolean;
		_updatedAt: Date;
	};
	success: boolean;
}

type GenericData = Record<string, unknown>;

export class RocketChatError extends Error {
	private statusCode: number;

	private response: GenericData;

	// rocketchat specific error type
	private errorType: string;

	constructor(e: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
		super(e.response.statusText);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, RocketChatError.prototype);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		this.statusCode = e.response.statusCode;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		this.response = e.response.data;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		this.errorType = e.response.data.errorType;
	}
}

interface AdminIdAndToken {
	id: string;
	token: string;
}

@Injectable()
export class RocketChatService {
	private adminIdAndToken?: AdminIdAndToken;

	constructor(
		@Inject(ROCKET_CHAT_CONFIG_TOKEN) private readonly config: RocketChatConfig,
		private readonly httpService: HttpService
	) {}

	public async me(authToken: string, userId: string): Promise<GenericData> {
		return this.get('/api/v1/me', authToken, userId);
	}

	public async setUserStatus(authToken: string, userId: string, status: string): Promise<GenericData> {
		return this.post('/api/v1/users.setStatus', authToken, userId, {
			message: '',
			status,
		});
	}

	public async createUserToken(userId: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/users.createToken', {
			userId,
		});
	}

	public async logoutUser(authToken: string, userId: string): Promise<GenericData> {
		return this.post('/api/v1/logout', authToken, userId, {});
	}

	public async getUserList(queryString: string): Promise<GenericData> {
		return this.getAsAdmin(`/api/v1/users.list?${queryString}`);
	}

	public async unarchiveGroup(groupName: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/groups.unarchive', {
			roomName: groupName,
		});
	}

	public async archiveGroup(groupName: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/groups.archive', {
			roomName: groupName,
		});
	}

	public async kickUserFromGroup(groupName: string, userId: string): Promise<GenericData> {
		const groupInfo: RocketChatGroupModel = await this.getGroupData(groupName);

		return this.postAsAdmin('/api/v1/groups.kick', {
			roomId: groupInfo.group._id,
			userId,
		});
	}

	public async inviteUserToGroup(groupName: string, userId: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/groups.invite', {
			roomName: groupName,
			userId,
		});
	}

	public async addGroupModerator(groupName: string, userId: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/groups.addModerator', {
			roomName: groupName,
			userId,
		});
	}

	public async removeGroupModerator(groupName: string, userId: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/groups.removeModerator', {
			roomName: groupName,
			userId,
		});
	}

	public async getGroupModerators(groupName: string): Promise<GenericData> {
		return this.getAsAdmin(`/api/v1/groups.moderators?roomName=${groupName}`);
	}

	public async getGroupMembers(groupName: string): Promise<GenericData> {
		return this.getAsAdmin(`/api/v1/groups.members?roomName=${groupName}`);
	}

	private async getGroupData(groupName: string): Promise<RocketChatGroupModel> {
		return this.getAsAdmin<RocketChatGroupModel>(`/api/v1/groups.info?roomName=${groupName}`);
	}

	public async createGroup(name: string, members: string[]): Promise<GenericData> {
		// group.name is only used
		return this.postAsAdmin('/api/v1/groups.create', {
			name,
			members,
		});
	}

	public async deleteGroup(groupName: string): Promise<GenericData> {
		// group.name is only used
		return this.postAsAdmin('/api/v1/groups.delete', {
			roomName: groupName,
		});
	}

	public async createUser(email: string, password: string, username: string, name: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/users.create', {
			email,
			password,
			username,
			name,
			verified: true,
		});
	}

	public async deleteUser(username: string): Promise<GenericData> {
		return this.postAsAdmin('/api/v1/users.delete', {
			username,
		});
	}

	private async postAsAdmin(path: string, body: GenericData): Promise<GenericData> {
		const adminIdAndToken = await this.getAdminIdAndToken();
		return this.post(path, adminIdAndToken.token, adminIdAndToken.id, body);
	}

	private async getAsAdmin<Type = GenericData>(path: string): Promise<Type> {
		const adminIdAndToken = await this.getAdminIdAndToken();
		return this.get<Type>(path, adminIdAndToken.token, adminIdAndToken.id);
	}

	private async get<Type = GenericData>(path: string, authToken: string, userId: string): Promise<Type> {
		const response = await lastValueFrom(
			this.httpService
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				.get(`${this.config.uri}${path}`, {
					headers: {
						'X-Auth-Token': authToken,
						'X-User-ID': userId,
					},
				})
				.pipe(
					catchError((e) => {
						throw new RocketChatError(e);
					})
				)
		);
		return response?.data as Type;
	}

	private async post(path: string, authToken: string, userId: string, body: GenericData): Promise<GenericData> {
		const response = await lastValueFrom(
			this.httpService
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				.post(`${this.config.uri}${path}`, body, {
					headers: {
						'X-Auth-Token': authToken,
						'X-User-ID': userId,
					},
				})
				.pipe(
					catchError((e) => {
						throw new RocketChatError(e);
					})
				)
		);
		return response?.data as GenericData;
	}

	private async getAdminIdAndToken(): Promise<AdminIdAndToken> {
		this.validateRocketChatConfig();

		if (this.adminIdAndToken) {
			return this.adminIdAndToken;
		}

		if (this.config.adminId && this.config.adminToken) {
			const newVar = { id: this.config.adminId, token: this.config.adminToken } as AdminIdAndToken;
			this.adminIdAndToken = newVar;
			return newVar;
		}
		const response = await lastValueFrom(
			this.httpService
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				.post(`${this.config.uri}/api/v1/login`, {
					user: this.config.adminUser,
					password: this.config.adminPassword,
				})
				.pipe(
					catchError((e) => {
						throw new RocketChatError(e);
					})
				)
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const responseJson = response?.data;
		this.adminIdAndToken = {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			id: responseJson.data.userId as string,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			token: responseJson.data.authToken as string,
		} as AdminIdAndToken;
		return this.adminIdAndToken;
	}

	private validateRocketChatConfig(): void {
		if (!this.config.uri) {
			throw new Error('rocket chat uri not set');
		}
		if (!(this.config.adminId && this.config.adminToken) && !(this.config.adminUser && this.config.adminPassword)) {
			throw new Error('rocket chat adminId and adminToken OR adminUser and adminPassword must be set');
		}
	}
}
