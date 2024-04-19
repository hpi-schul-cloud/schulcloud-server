import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import {
	InlineResponse200,
	InlineResponse2001,
	InlineResponse2002,
	InlineResponse2003,
	InlineResponse2004,
	InlineResponse2006,
	InlineResponse2006Data,
} from './etherpad-api-client';
import { AuthorApi, GroupApi, SessionApi } from './etherpad-api-client/api';
import { AuthorId, EtherpadErrorType, EtherpadParams, EtherpadResponse, GroupId, PadId, SessionId } from './interface';
import { EtherpadResponseMapper } from './mappers';

@Injectable()
export class EtherpadClientAdapter {
	constructor(
		private readonly groupApi: GroupApi,
		private readonly sessionApi: SessionApi,
		private readonly authorApi: AuthorApi
	) {}

	async getOrCreateAuthor(userId: EntityId, username: string): Promise<AuthorId> {
		const response = await this.tryCreateAuthor(userId, username);
		const user = this.handleResponse<InlineResponse2003>(response, { userId });

		const authorId = EtherpadResponseMapper.mapToAuthorResponse(user);

		return authorId;
	}

	private async tryCreateAuthor(userId: string, username: string) {
		try {
			const response = await this.authorApi.createAuthorIfNotExistsForUsingGET(userId, username);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { userId }, error);
		}
	}

	async getOrCreateSession(
		groupId: GroupId,
		authorId: AuthorId,
		parentId: EntityId,
		sessionCookieExpire: Date
	): Promise<SessionId> {
		let sessionId: SessionId | undefined;
		sessionId = await this.getSessionIdByGroupAndAuthor(groupId, authorId);

		if (sessionId) {
			return sessionId;
		}

		const response = await this.tryCreateSession(groupId, authorId, sessionCookieExpire);
		const session = this.handleResponse<InlineResponse2004>(response, { parentId });

		sessionId = EtherpadResponseMapper.mapToSessionResponse(session);

		return sessionId;
	}

	private async tryCreateSession(groupId: string, authorId: string, sessionCookieExpire: Date) {
		try {
			const response = await this.sessionApi.createSessionUsingGET(
				groupId,
				authorId,
				sessionCookieExpire.getTime().toString()
			);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	private async getSessionIdByGroupAndAuthor(groupId: GroupId, authorId: AuthorId): Promise<SessionId | undefined> {
		let sessionId: SessionId | undefined;

		const response = await this.tryListSessionsOfAuthor(authorId);
		const sessions = this.handleResponse<InlineResponse2006>(response, { groupId, authorId });

		if (sessions) {
			sessionId = this.findSessionId(sessions, groupId, authorId);
		}

		return sessionId;
	}

	private findSessionId(sessions: InlineResponse2006Data, groupId: string, authorId: string) {
		const sessionEntries = Object.entries(sessions);
		const sessionId = sessionEntries.map(([key, value]: [string, { groupID: string; authorID: string }]) => {
			if (value.groupID === groupId && value.authorID === authorId) {
				return key;
			}

			return undefined;
		});

		return sessionId[0];
	}

	async listSessionsOfAuthor(authorId: AuthorId): Promise<SessionId[]> {
		const response = await this.tryListSessionsOfAuthor(authorId);
		const sessions = this.handleResponse<InlineResponse2006>(response, { authorId });

		const sessionIds = Object.keys(sessions as object);

		return sessionIds;
	}

	private async tryListSessionsOfAuthor(authorId: string) {
		try {
			const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	async getOrCreateGroup(parentId: EntityId): Promise<GroupId> {
		const groupResponse = await this.tryGetOrCreateGroup(parentId);
		const group = this.handleResponse<InlineResponse200>(groupResponse, { parentId });

		const groupId = EtherpadResponseMapper.mapToGroupResponse(group);

		return groupId;
	}

	private async tryGetOrCreateGroup(parentId: string) {
		try {
			const response = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { parentId }, error);
		}
	}

	async getOrCreateEtherpad(groupId: GroupId, parentId: EntityId): Promise<PadId> {
		let padId: PadId | undefined;

		padId = await this.getPad(groupId, parentId);

		if (!padId) {
			const padResponse = await this.tryCreateEtherpad(groupId, parentId);
			const pad = this.handleResponse<InlineResponse2001>(padResponse, { parentId });

			padId = EtherpadResponseMapper.mapToPadResponse(pad);
		}

		return padId;
	}

	private async tryCreateEtherpad(groupId: string, parentId: string) {
		try {
			const response = await this.groupApi.createGroupPadUsingGET(groupId, parentId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	private async getPad(groupId: GroupId, parentId: EntityId): Promise<PadId | undefined> {
		const padsResponse = await this.tryListPads(groupId);
		const pads = this.handleResponse<InlineResponse2002>(padsResponse, { parentId });

		const pad = pads?.padIDs?.find((padId: string) => padId.includes(`${groupId}$${parentId}`));

		return pad;
	}

	private async tryListPads(groupId: string) {
		try {
			const response = await this.groupApi.listPadsUsingGET(groupId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	private handleResponse<T extends EtherpadResponse>(axiosResponse: AxiosResponse<T>, payload: EtherpadParams) {
		const response = axiosResponse.data;

		switch (response.code) {
			case 1:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.BAD_REQUEST, payload, response);
			case 2:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.INTERNAL_ERROR, payload, response);
			case 3:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.FUNCTION_NOT_FOUND, payload, response);
			case 4:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.WRONG_API_KEY, payload, response);
			default:
				return response.data as T['data'];
		}
	}
}
