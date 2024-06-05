import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TypeGuard } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import {
	CreateAuthorUsingGET200Response,
	CreateGroupUsingGET200Response,
	CreateSessionUsingGET200Response,
	DeleteGroupUsingGET200Response,
	ListAuthorsOfPadUsingGET200Response,
	ListPadsUsingGET200Response,
	ListSessionsOfGroupUsingGET200Response,
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
	Session,
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

	public async getOrCreateAuthorId(userId: EntityId, username?: string): Promise<AuthorId> {
		const response = await this.tryCreateAuthor(userId, username);
		const user = this.handleEtherpadResponse(response, { userId });

		const authorId = EtherpadResponseMapper.mapToAuthorResponse(user);

		return authorId;
	}

	private async tryCreateAuthor(
		userId: string,
		username?: string
	): Promise<AxiosResponse<CreateAuthorUsingGET200Response>> {
		try {
			const response = await this.authorApi.createAuthorIfNotExistsForUsingGET(userId, username);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { userId }, error);
		}
	}

	public async listPadsOfAuthor(authorId: AuthorId): Promise<PadId[]> {
		const response = await this.tryGetPadsOfAuthor(authorId);
		const pads = this.handleEtherpadResponse<ListPadsUsingGET200Response>(response, { authorId });

		if (!TypeGuard.isObject(pads)) {
			throw new InternalServerErrorException('Etherpad listPadsOfAuthor response is not an object');
		}

		const padIds = pads?.padIDs as PadId[];

		return padIds;
	}

	private async tryGetPadsOfAuthor(authorId: AuthorId): Promise<AxiosResponse<ListPadsUsingGET200Response>> {
		try {
			const response = await this.authorApi.listPadsOfAuthorUsingGET(authorId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	public async getOrCreateSessionId(
		groupId: GroupId,
		authorId: AuthorId,
		parentId: EntityId,
		sessionCookieExpire: Date,
		durationThreshold: number
	): Promise<SessionId> {
		const session = await this.getSessionByGroupAndAuthor(groupId, authorId);

		if (session && this.isSessionDurationSufficient(session, durationThreshold)) {
			return session.id;
		}

		const response = await this.tryCreateSession(groupId, authorId, sessionCookieExpire);
		const newSession = this.handleEtherpadResponse<CreateSessionUsingGET200Response>(response, { parentId });

		const sessionId = EtherpadResponseMapper.mapToSessionResponse(newSession);

		return sessionId;
	}

	private isSessionDurationSufficient(session: Session, durationThreshold: number): boolean {
		const nowUnixTimestampInSeconds = Math.floor(new Date(Date.now()).getTime() / 1000);
		const timeDiff = session.validUntil - nowUnixTimestampInSeconds;
		const isDurationSufficient = timeDiff > durationThreshold;

		return isDurationSufficient;
	}

	private async tryCreateSession(
		groupId: string,
		authorId: string,
		sessionCookieExpire: Date
	): Promise<AxiosResponse<CreateSessionUsingGET200Response>> {
		try {
			const unixTimeInSeconds = Math.floor(sessionCookieExpire.getTime() / 1000);
			const response = await this.sessionApi.createSessionUsingGET(groupId, authorId, unixTimeInSeconds.toString());

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	private async getSessionByGroupAndAuthor(groupId: GroupId, authorId: AuthorId): Promise<Session | undefined> {
		const response = await this.tryListSessionsOfAuthor(authorId);
		const etherpadSessions = this.handleEtherpadResponse<ListSessionsOfGroupUsingGET200Response>(response, {
			authorId,
		});
		const sessions = EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions);

		const session = this.findSession(sessions, groupId, authorId);

		return session;
	}

	private findSession(sessions: Session[], groupId: string, authorId: string): Session | undefined {
		const filteredAndSortedSessions = sessions
			.filter((session) => session.groupId === groupId && session.authorId === authorId)
			.sort((sessionA, sessionB) => sessionB.validUntil - sessionA.validUntil);

		const newestSessionByGroupAndAuthor = filteredAndSortedSessions[0];

		return newestSessionByGroupAndAuthor;
	}

	public async listSessionIdsOfAuthor(authorId: AuthorId): Promise<SessionId[]> {
		const response = await this.tryListSessionsOfAuthor(authorId);
		const etherpadSessions = this.handleEtherpadResponse<ListSessionsOfGroupUsingGET200Response>(response, {
			authorId,
		});
		const sessions = EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions);

		const sessionIds = sessions.map((session) => session.id);

		return sessionIds;
	}

	private async tryListSessionsOfAuthor(
		authorId: AuthorId
	): Promise<AxiosResponse<ListSessionsOfGroupUsingGET200Response>> {
		try {
			const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { authorId }, error);
		}
	}

	public async getOrCreateGroupId(parentId: EntityId): Promise<GroupId> {
		const groupResponse = await this.tryGetOrCreateGroup(parentId);
		const group = this.handleEtherpadResponse<CreateGroupUsingGET200Response>(groupResponse, { parentId });

		const groupId = EtherpadResponseMapper.mapToGroupResponse(group);

		return groupId;
	}

	private async tryGetOrCreateGroup(parentId: string): Promise<AxiosResponse<CreateGroupUsingGET200Response>> {
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
			const pad = this.handleEtherpadResponse<DeleteGroupUsingGET200Response>(padResponse, { parentId });

			padId = EtherpadResponseMapper.mapToPadResponse(pad);
		}

		return padId;
	}

	private async tryCreateEtherpad(
		groupId: string,
		parentId: string
	): Promise<AxiosResponse<DeleteGroupUsingGET200Response>> {
		try {
			const response = await this.groupApi.createGroupPadUsingGET(groupId, parentId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	private async getPadId(groupId: GroupId, parentId: EntityId): Promise<PadId | undefined> {
		const padsResponse = await this.tryListPads(groupId);
		const pads = this.handleEtherpadResponse<ListPadsUsingGET200Response>(padsResponse, { parentId });

		const padId = pads?.padIDs?.find((id: string) => id.includes(`${groupId}$${parentId}`));

		return padId;
	}

	private async tryListPads(groupId: string): Promise<AxiosResponse<ListPadsUsingGET200Response>> {
		try {
			const response = await this.groupApi.listPadsUsingGET(groupId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	public async deleteGroup(groupId: GroupId): Promise<void> {
		const response = await this.tryDeleteGroup(groupId);
		this.handleEtherpadResponse<DeleteGroupUsingGET200Response>(response, { groupId });
	}

	private async tryDeleteGroup(groupId: string): Promise<AxiosResponse<DeleteGroupUsingGET200Response>> {
		try {
			const response = await this.groupApi.deleteGroupUsingPOST(groupId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { groupId }, error);
		}
	}

	public async listAuthorsOfPad(padId: PadId): Promise<AuthorId[]> {
		const response = await this.tryGetAuthorsOfPad(padId);
		const authors = this.handleEtherpadResponse<ListAuthorsOfPadUsingGET200Response>(response, { padId });

		if (!TypeGuard.isObject(authors)) {
			throw new InternalServerErrorException('Etherpad listAuthorsOfPad response is not an object');
		}

		const authorIds = authors?.authorIDs as AuthorId[];

		return authorIds;
	}

	private async tryGetAuthorsOfPad(padId: PadId): Promise<AxiosResponse<ListAuthorsOfPadUsingGET200Response>> {
		try {
			const response = await this.padApi.listAuthorsOfPadUsingGET(padId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { padId }, error);
		}
	}

	public async deleteSession(sessionId: SessionId): Promise<void> {
		const response = await this.tryDeleteSession(sessionId);
		this.handleEtherpadResponse<DeleteGroupUsingGET200Response>(response, { sessionId });
	}

	private async tryDeleteSession(sessionId: SessionId): Promise<AxiosResponse<DeleteGroupUsingGET200Response>> {
		try {
			const response = await this.sessionApi.deleteSessionUsingPOST(sessionId);

			return response;
		} catch (error) {
			throw EtherpadResponseMapper.mapResponseToException(EtherpadErrorType.CONNECTION_ERROR, { sessionId }, error);
		}
	}

	public async deletePad(padId: EntityId): Promise<DeleteGroupUsingGET200Response | undefined> {
		const response = await this.tryDeletePad(padId);
		const responseData = this.handleEtherpadResponse<DeleteGroupUsingGET200Response>(response, { padId });

		return responseData;
	}

	private async tryDeletePad(padId: PadId): Promise<AxiosResponse<DeleteGroupUsingGET200Response>> {
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
