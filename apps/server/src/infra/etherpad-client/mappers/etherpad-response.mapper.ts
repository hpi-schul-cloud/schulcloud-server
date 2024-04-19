import { ErrorUtils } from '@src/core/error/utils';
import { InlineResponse2003Data, InlineResponse2004Data, InlineResponse200Data } from '../etherpad-api-client';
import { AuthorId, EtherpadErrorType, EtherpadParams, EtherpadResponse, GroupId, PadId, SessionId } from '../interface';
import { EtherpadErrorLoggableException } from '../loggable';

export class EtherpadResponseMapper {
	static mapToSessionResponse(session?: InlineResponse2004Data): SessionId {
		if (!session?.sessionID) {
			throw new Error('Session could not be created');
		}
		const sessionId = session.sessionID;

		return sessionId;
	}

	static mapToAuthorResponse(author?: InlineResponse2003Data): AuthorId {
		if (!author?.authorID) {
			throw new Error('Author could not be created');
		}
		const authorId = author.authorID;

		return authorId;
	}

	static mapToGroupResponse(group?: InlineResponse200Data): GroupId {
		if (!group?.groupID) {
			throw new Error('Group could not be created');
		}
		const groupId = group.groupID;

		return groupId;
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
		type: EtherpadErrorType,
		payload: EtherpadParams,
		response: T | Error
	): EtherpadErrorLoggableException {
		return new EtherpadErrorLoggableException(type, payload, ErrorUtils.createHttpExceptionOptions(response.message));
	}
}
