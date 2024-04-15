import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import {
	InlineResponse200,
	InlineResponse2001,
	InlineResponse2002,
	InlineResponse2003,
	InlineResponse2004,
	InlineResponse2006,
} from './generated-etherpad-api-client';
import { AuthorApi, GroupApi, SessionApi } from './generated-etherpad-api-client/api';
import { AuthorId, ErrorType, EtherpadParams, EtherpadResponse, GroupId, PadId, SessionId } from './interface';
import { EtherpadServerError } from './loggable';
import { EtherpadResponseMapper } from './mappers';

@Injectable()
export class EtherpadClientAdapter {
	constructor(
		private readonly groupApi: GroupApi,
		private readonly sessionApi: SessionApi,
		private readonly authorApi: AuthorApi,
		private logger: Logger
	) {
		this.logger.setContext(EtherpadClientAdapter.name);
	}

	async getOrCreateAuthor(userId: EntityId, username: string): Promise<AuthorId> {
		const response = await this.authorApi.createAuthorIfNotExistsForUsingGET(userId, username);
		const user = this.handleResponse<InlineResponse2003>(response, { userId });

		const authorId = EtherpadResponseMapper.mapToAuthorResponse(user);

		return authorId;
	}

	async getOrCreateSession(
		groupId: GroupId,
		authorId: AuthorId,
		parentId: EntityId,
		sessionCookieExpire: Date
	): Promise<SessionId> {
		const foundedSession = await this.hasSessionsOfAuthor(groupId, authorId);
		if (foundedSession) {
			return foundedSession;
		}

		const response = await this.sessionApi.createSessionUsingGET(
			groupId,
			authorId,
			sessionCookieExpire.getTime().toString()
		);
		const session = this.handleResponse<InlineResponse2004>(response, { parentId });

		const sessionId = EtherpadResponseMapper.mapToSessionResponse(session);

		return sessionId;
	}

	private async hasSessionsOfAuthor(groupId: GroupId, authorId: AuthorId): Promise<SessionId | undefined> {
		const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);
		const sessions = this.handleResponse<InlineResponse2006>(response, {});

		if (sessions) {
			for (const [key, value] of Object.entries(sessions)) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (value.groupID === groupId && value.authorID === authorId) {
					return key;
				}
			}
		}

		return undefined;
	}

	async listSessionsOfAuthor(authorId: AuthorId): Promise<SessionId[]> {
		const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);
		const sessions = this.handleResponse<InlineResponse2006>(response, {});

		const sessionIds = Object.keys(sessions as object);

		return sessionIds;
	}

	async getOrCreateGroup(parentId: EntityId): Promise<GroupId> {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const group = this.handleResponse<InlineResponse200>(groupResponse, { parentId });

		const groupId = EtherpadResponseMapper.mapToGroupResponse(group);

		return groupId;
	}

	async getOrCreateEtherpad(groupId: GroupId, parentId: EntityId): Promise<PadId> {
		let padId: PadId | undefined;

		padId = await this.getPad(groupId, parentId);

		if (!padId) {
			const padResponse = await this.groupApi.createGroupPadUsingGET(groupId, parentId);
			const pad = this.handleResponse<InlineResponse2001>(padResponse, { parentId });

			padId = EtherpadResponseMapper.mapToPadResponse(pad);
		}

		return padId;
	}

	private async getPad(groupId: GroupId, parentId: EntityId): Promise<PadId | undefined> {
		const padsResponse = await this.groupApi.listPadsUsingGET(groupId);
		const pads = this.handleResponse<InlineResponse2002>(padsResponse, { parentId });

		const pad = pads?.padIDs?.find((padId: string) => padId.includes(`${groupId}$${parentId}`));

		return pad;
	}

	private handleResponse<T extends EtherpadResponse>(axiosResponse: AxiosResponse<T>, payload: EtherpadParams) {
		const response = axiosResponse.data;
		switch (response.code) {
			case 1:
				throw new EtherpadServerError(ErrorType.ETHERPAD_SERVER_BAD_REQUEST, payload, response as unknown as Error);
			case 2:
				throw new EtherpadServerError(ErrorType.ETHERPAD_SERVER_INTERNAL_ERROR, payload, response as unknown as Error);
			case 3:
				throw new EtherpadServerError(
					ErrorType.ETHERPAD_SERVER_FUNCTION_NOT_FOUND,
					payload,
					response as unknown as Error
				);
			case 4:
				throw new EtherpadServerError(ErrorType.ETHERPAD_SERVER_WRONG_API_KEY, payload, response as unknown as Error);
			default:
				return response.data as T['data'];
		}
	}
}
