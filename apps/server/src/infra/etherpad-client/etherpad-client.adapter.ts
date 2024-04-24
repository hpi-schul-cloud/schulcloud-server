import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { AuthorApi, GroupApi, PadApi, SessionApi } from './etherpad-api-client/api';
import {
	AuthorId,
	EtherpadErrorType,
	EtherpadParams,
	EtherpadResponse,
	EtherpadResponseCode,
	GroupId,
	PadId,
	SessionId,
} from './interface';
import { EtherpadResponseMapper } from './mappers';

@Injectable()
export class EtherpadClientAdapter {
	constructor(
		private readonly groupApi: GroupApi,
		private readonly sessionApi: SessionApi,
		private readonly authorApi: AuthorApi,
		private readonly padApi: PadApi
	) {}

	public async getOrCreateAuthorId(userId: EntityId, username: string): Promise<AuthorId> {
		const response = await this.tryCreateAuthor(userId, username);
		const user = this.handleEtherpadResponse<InlineResponse2003>(response, { userId });

		const authorId = EtherpadResponseMapper.mapToAuthorResponse(user);

		return authorId;
	}

	private async tryCreateAuthor(userId: string, username: string): Promise<AxiosResponse<InlineResponse2003>> {
		try {
			const response = await this.authorApi.createAuthorIfNotExistsForUsingGET(userId, username);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { userId }, error);
		}
	}

	public async getOrCreateSessionId(
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
		const session = this.handleEtherpadResponse<InlineResponse2004>(response, { parentId });

		sessionId = EtherpadResponseMapper.mapToSessionResponse(session);

		return sessionId;
	}

	private async tryCreateSession(
		groupId: string,
		authorId: string,
		sessionCookieExpire: Date
	): Promise<AxiosResponse<InlineResponse2004>> {
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
		const sessions = this.handleEtherpadResponse<InlineResponse2006>(response, { groupId, authorId });

		if (sessions) {
			sessionId = this.findSessionId(sessions, groupId, authorId);
		}

		return sessionId;
	}

	private findSessionId(sessions: InlineResponse2006Data, groupId: string, authorId: string): string | undefined {
		const sessionEntries = Object.entries(sessions);
		const sessionId = sessionEntries.map(([key, value]: [string, { groupID: string; authorID: string }]) => {
			if (value.groupID === groupId && value.authorID === authorId) {
				return key;
			}

			return undefined;
		});

		return sessionId[0];
	}

	public async listSessionIdsOfAuthor(authorId: AuthorId): Promise<SessionId[]> {
		const response = await this.tryListSessionsOfAuthor(authorId);
		const sessions = this.handleEtherpadResponse<InlineResponse2006>(response, { authorId });

		// InlineResponse2006Data has the wrong type definition. Therefore we savely cast it to an object.
		if (!this.isObject(sessions)) {
			throw new InternalServerErrorException('Etherpad session ids response is not an object');
		}

		const sessionIds = Object.keys(sessions);

		return sessionIds;
	}

	private isObject(value: any): value is object {
		return typeof value === 'object' && !Array.isArray(value) && value !== null;
	}

	private async tryListSessionsOfAuthor(authorId: string): Promise<AxiosResponse<InlineResponse2006>> {
		try {
			const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	public async getOrCreateGroupId(parentId: EntityId): Promise<GroupId> {
		const groupResponse = await this.tryGetOrCreateGroup(parentId);
		const group = this.handleEtherpadResponse<InlineResponse200>(groupResponse, { parentId });

		const groupId = EtherpadResponseMapper.mapToGroupResponse(group);

		return groupId;
	}

	private async tryGetOrCreateGroup(parentId: string): Promise<AxiosResponse<InlineResponse200>> {
		try {
			const response = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { parentId }, error);
		}
	}

	public async getOrCreateEtherpadId(groupId: GroupId, parentId: EntityId): Promise<PadId> {
		let padId: PadId | undefined;

		padId = await this.getPadId(groupId, parentId);

		if (!padId) {
			const padResponse = await this.tryCreateEtherpad(groupId, parentId);
			const pad = this.handleEtherpadResponse<InlineResponse2001>(padResponse, { parentId });

			padId = EtherpadResponseMapper.mapToPadResponse(pad);
		}

		return padId;
	}

	private async tryCreateEtherpad(groupId: string, parentId: string): Promise<AxiosResponse<InlineResponse2001>> {
		try {
			const response = await this.groupApi.createGroupPadUsingGET(groupId, parentId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	private async getPadId(groupId: GroupId, parentId: EntityId): Promise<PadId | undefined> {
		const padsResponse = await this.tryListPads(groupId);
		const pads = this.handleEtherpadResponse<InlineResponse2002>(padsResponse, { parentId });

		const padId = pads?.padIDs?.find((id: string) => id.includes(`${groupId}$${parentId}`));

		return padId;
	}

	private async tryListPads(groupId: string): Promise<AxiosResponse<InlineResponse2002>> {
		try {
			const response = await this.groupApi.listPadsUsingGET(groupId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	public async deletePad(padId: PadId): Promise<void> {
		const response = await this.tryDeletePad(padId);
		this.handleEtherpadResponse<InlineResponse2001>(response, { padId });
	}

	private async tryDeletePad(padId: string): Promise<AxiosResponse<InlineResponse2001>> {
		try {
			const response = await this.padApi.deletePadUsingPOST(padId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { padId }, error);
		}
	}

	private handleEtherpadResponse<T extends EtherpadResponse>(
		axiosResponse: AxiosResponse<T>,
		payload: EtherpadParams
	): T['data'] {
		const response = axiosResponse.data;

		switch (response.code) {
			case EtherpadResponseCode.OK:
				return response.data;
			case EtherpadResponseCode.BAD_REQUEST:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.BAD_REQUEST, payload, response);
			case EtherpadResponseCode.INTERNAL_ERROR:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.INTERNAL_ERROR, payload, response);
			case EtherpadResponseCode.FUNCTION_NOT_FOUND:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.FUNCTION_NOT_FOUND, payload, response);
			case EtherpadResponseCode.WRONG_API_KEY:
				throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.WRONG_API_KEY, payload, response);
			default:
				throw new InternalServerErrorException('Etherpad response code unknown');
		}
	}
}
