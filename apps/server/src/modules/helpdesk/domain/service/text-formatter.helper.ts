import { HelpdeskProblemProps, HelpdeskWishProps, UserContextProps, UserDeviceProps } from '../interface';

export class TextFormatter {
	public static createProblemText(
		problem: HelpdeskProblemProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = [
			'Helpdesk-Problem melden\n\n',
			this.buildContextAndDeviceInfo(userContext, userDevice, problem.consent),
			'\n--- Problemdetails ---\n',
			this.buildProblemDescription(problem),
		].join('');

		return text;
	}

	public static createWishText(
		wish: HelpdeskWishProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = [
			'Helpdesk-Wunsch einreichen\n\n',
			'--- Wunschdetails ---\n',
			this.buildWishDescription(wish),
			this.buildContextAndDeviceInfo(userContext, userDevice, wish.consent),
		].join('');

		return text;
	}

	private static buildWishDescription(wish: HelpdeskWishProps): string {
		const details = [
			`Betreff: ${wish.subject}\n`,
			`Problemfeld: ${wish.problemArea.join(', ')}\n`,
			`Rolle: ${wish.role}\n`,
			`Wunsch: ${wish.desire}\n`,
			`Nutzen: ${wish.benefit}\n`,
		];

		if (wish.acceptanceCriteria) {
			details.push(`Akzeptanzkriterien: ${wish.acceptanceCriteria}\n`);
		}

		return details.join('');
	}

	private static buildProblemDescription(problem: HelpdeskProblemProps): string {
		const details = [
			`Betreff: ${problem.subject}\n`,
			`Problemfeld: ${problem.problemArea.join(', ')}\n`,
			`Problembeschreibung: ${problem.problemDescription}\n`,
		];

		if (problem.device) {
			details.push(`Gerät: ${problem.device}\n`);
		}

		return details.join('');
	}

	private static buildUserContextInfo(userContext: UserContextProps): string {
		const text = [
			`Nutzer-ID: ${userContext.userId}\n`,
			`Nutzername: ${userContext.userName}\n`,
			`Nutzer-E-Mail: ${userContext.userEmail}\n`,
			`Nutzerrollen: ${userContext.userRoles?.join(', ') || 'N/A'}\n`,
			`Schul-ID: ${userContext.schoolId}\n`,
			`Schulname: ${userContext.schoolName}\n`,
		].join('');

		return text;
	}

	private static buildDeviceInfo(userDevice?: UserDeviceProps): string {
		if (!userDevice) {
			return 'Keine Geräteinformationen vorhanden.';
		}

		const text = [
			`Geräte-User-Agent: ${userDevice.deviceUserAgent || 'N/A'}\n`,
			`Browser-Name: ${userDevice.browserName || 'N/A'}\n`,
			`Browser-Version: ${userDevice.browserVersion || 'N/A'}\n`,
			`Betriebssystem: ${userDevice.os || 'N/A'}\n`,
		].join('');

		return text;
	}

	private static buildContextAndDeviceInfo(
		userContext: UserContextProps,
		userDevice?: UserDeviceProps,
		consent?: boolean
	): string {
		const userContextInfo = this.buildUserContextInfo(userContext);
		const deviceInfo = consent ? this.buildDeviceInfo(userDevice) : 'N/A';

		const text = [
			'\n--- Systeminformationen ---\n',
			userContextInfo,
			'\n--- Geräteinformationen ---\n',
			deviceInfo,
		].join('');

		return text;
	}
}
