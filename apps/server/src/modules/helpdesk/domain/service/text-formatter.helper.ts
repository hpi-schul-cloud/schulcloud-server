import { HelpdeskProblemProps, HelpdeskWishProps, UserContextProps, UserDeviceProps } from '../interface';

export class TextFormatter {
	public static createProblemText(
		problem: HelpdeskProblemProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = `
SystemInformation:
User login: ${userContext.userName}
User role(s): ${userContext.userRoles?.join(', ') || ''}
User registrated email: ${userContext.userEmail} \n

ReplyEmail: ${problem.replyEmail}
User: ${userContext.userName || 'nouser'}
User-ID: ${userContext.userId}
Schule: ${userContext.schoolName}
Schule-ID: ${userContext.schoolId}
Instanz: ${userContext.instanceName}
Browser: ${userDevice?.browserName || ''}
Browser Version: ${userDevice?.browserVersion || ''}
Betriebssystem: ${userDevice?.os || ''}
Gerät: ${problem.device || ''} [auto-detection: ${userDevice?.deviceUserAgent || ''}]
Problembereich: ${problem.problemArea.join(', ')} \n

User meldet folgendes:
Problem Kurzbeschreibung: ${problem.subject}
Problembeschreibung: ${problem.problemDescription}
`;

		return text;
	}

	public static createWishText(
		wish: HelpdeskWishProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = `
SystemInformation:
User login: ${userContext.userName}
User role(s): ${userContext.userRoles?.join(', ') || ''}
User registrated email: ${userContext.userEmail} \n

ReplyEmail: ${wish.replyEmail}
User: ${userContext.userName || 'nouser'}
User-ID: ${userContext.userId}
Schule: ${userContext.schoolName}
Schule-ID: ${userContext.schoolId}
Instanz: ${userContext.instanceName}
Browser: ${userDevice?.browserName || ''}
Browser Version: ${userDevice?.browserVersion || ''}
Betriebssystem: ${userDevice?.os || ''}
Gerät: ${wish.device || ''} [auto-detection: ${userDevice?.deviceUserAgent || ''}]
Problembereich: ${wish.problemArea.join(', ')} \n

User schrieb folgendes: ${wish.subject} \n
Als ${wish.role}
möchte ich ${wish.desire},
um ${wish.benefit}.
Akzeptanzkriterien: ${wish.acceptanceCriteria || ''}
`;

		return text;
	}
}
