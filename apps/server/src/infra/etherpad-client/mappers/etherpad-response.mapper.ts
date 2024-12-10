import { InternalServerErrorException } from '@nestjs/common';
import { TypeGuard } from '@shared/common';
import { ErrorUtils } from '@src/core/error/utils';
import {
	CreateAuthorUsingGET200ResponseData,
	CreateGroupUsingGET200ResponseData,
	CreateSessionUsingGET200ResponseData,
} from '../etherpad-api-client';
import {
	AuthorId,
	EtherpadErrorType,
	EtherpadParams,
	EtherpadResponse,
	GroupId,
	PadId,
	Session,
	SessionId,
} from '../interface';
import { EtherpadErrorLoggableException } from '../loggable';

export class EtherpadResponseMapper {
	static mapToSessionResponse(session?: CreateSessionUsingGET200ResponseData): SessionId {
		if (!session?.sessionID) {
			throw new Error('Session could not be created');
		}
		const sessionId = session.sessionID;

		return sessionId;
	}

	static mapToAuthorResponse(author?: CreateAuthorUsingGET200ResponseData): AuthorId {
		if (!author?.authorID) {
			throw new Error('Author could not be created');
		}
		const authorId = author.authorID;

		return authorId;
	}

	static mapToGroupResponse(group?: CreateGroupUsingGET200ResponseData): GroupId {
		if (!group?.groupID) {
			throw new Error('Group could not be created');
		}
		const groupId = group.groupID;

		return groupId;
	}

	static mapToPadResponse(pad?: object): PadId {
		// DeleteGroupUsingGET200Response has wrong type definition
		if (pad && 'padID' in pad && pad.padID) {
			const padId = pad.padID as string;

			return padId;
		}

		throw new Error('Pad could not be created');
	}

	static mapResponseToException<T extends EtherpadResponse>(
		type: EtherpadErrorType,
		payload: EtherpadParams,
		response: T | Error
	): EtherpadErrorLoggableException {
		return new EtherpadErrorLoggableException(
			type,
			payload,
			response.message,
			ErrorUtils.createHttpExceptionOptions(response.message)
		);
	}

	static mapEtherpadSessionsToSessions(etherpadSessions: unknown): Session[] {
		try {
			const isObject = TypeGuard.isDefinedObject(etherpadSessions);
			if (!isObject) return [];

			const sessions = Object.entries(etherpadSessions)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.filter(([key, value]) => value !== null)
				.map(([key, value]) => this.mapEtherpadSessionToSession([key, value]));

			return sessions;
		} catch (error) {
			throw new InternalServerErrorException('Etherpad session data is not valid', { cause: error });
		}
	}

	static mapEtherpadSessionToSession([etherpadId, etherpadSession]: [string, unknown | undefined]): Session {
		if (
			!TypeGuard.isDefinedObject(etherpadSession) ||
			!('groupID' in etherpadSession) ||
			!('authorID' in etherpadSession) ||
			!('validUntil' in etherpadSession)
		)
			throw new Error('Etherpad session is missing required properties');

		const groupId = TypeGuard.checkString(etherpadSession.groupID);
		const authorId = TypeGuard.checkString(etherpadSession.authorID);
		const validUntil = TypeGuard.checkNumber(etherpadSession.validUntil);

		const session: Session = {
			id: etherpadId,
			groupId,
			authorId,
			validUntil,
		};

		return session;
	}
}
