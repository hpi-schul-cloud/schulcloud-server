import { ErrorUtils } from '@src/core/error/utils';
import { InlineResponse2003Data, InlineResponse2004Data, InlineResponse200Data } from '../etherpad-api-client';
import { AuthorId, ErrorType, EtherpadParams, EtherpadResponse, GroupId, PadId, SessionId } from '../interface';
import { EtherpadErrorLoggableException } from '../loggable';

export class EtherpadResponseMapper {
	static mapToSessionResponse(session?: InlineResponse2004Data): SessionId {
		if (session?.sessionID) {
			const sessionId = session.sessionID;

			return sessionId;
		}

		throw new Error('Session could not be created');
	}

	static mapToAuthorResponse(author?: InlineResponse2003Data): AuthorId {
		if (author?.authorID) {
			const authorId = author.authorID;

			return authorId;
		}

		throw new Error('Author could not be created');
	}

	static mapToGroupResponse(group?: InlineResponse200Data): GroupId {
		if (group?.groupID) {
			const groupId = group.groupID;

			return groupId;
		}

		throw new Error('Group could not be created');
	}

	static mapToPadResponse(pad?: object): PadId {
		// InlineResponse2001 has wrong type definition
		if (pad && 'padID' in pad && pad.padID) {
			const padId = pad.padID as string;

			return padId;
		}

		throw new Error('Pad could not be created');
	}

	static mapResponseToException<T extends EtherpadResponse>(
		type: ErrorType,
		payload: EtherpadParams,
		response: T | Error
	): EtherpadErrorLoggableException {
		return new EtherpadErrorLoggableException(type, payload, ErrorUtils.createHttpExceptionOptions(response.message));
	}
}
