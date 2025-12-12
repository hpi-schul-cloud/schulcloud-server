import { HelpdeskProblemProps, HelpdeskWishProps, UserContextProps, UserDeviceProps } from '../interface';

export class TextFormatter {
	public static createProblemText(
		problem: HelpdeskProblemProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = [
			'Helpdesk Problem Submission\n\n',
			'--- Problem Details ---\n',
			this.buildProblemDescription(problem),
			this.buildContextAndDeviceInfo(userContext, userDevice, problem.consent),
		].join('');

		return text;
	}

	public static createWishText(
		wish: HelpdeskWishProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const text = [
			'Helpdesk Wish Submission\n\n',
			'--- Wish Details ---\n',
			this.buildWishDescription(wish),
			this.buildContextAndDeviceInfo(userContext, userDevice, wish.consent),
		].join('');

		return text;
	}

	private static buildWishDescription(wish: HelpdeskWishProps): string {
		const details = [
			`Subject: ${wish.subject}\n`,
			`Problem Area: ${wish.problemArea.join(', ')}\n`,
			`Role: ${wish.role}\n`,
			`Desire: ${wish.desire}\n`,
			`Benefit: ${wish.benefit}\n`,
		];

		if (wish.acceptanceCriteria) {
			details.push(`Acceptance Criteria: ${wish.acceptanceCriteria}\n`);
		}

		return details.join('');
	}

	private static buildProblemDescription(problem: HelpdeskProblemProps): string {
		const details = [
			`Subject: ${problem.subject}\n`,
			`Problem Area: ${problem.problemArea.join(', ')}\n`,
			`Problem Description: ${problem.problemDescription}\n`,
		];

		if (problem.device) {
			details.push(`Device: ${problem.device}\n`);
		}

		return details.join('');
	}

	private static buildUserContextInfo(userContext: UserContextProps): string {
		const text = [
			`User ID: ${userContext.userId}\n`,
			`User Name: ${userContext.userName}\n`,
			`User Email: ${userContext.userEmail}\n`,
			`User Roles: ${userContext.userRoles?.join(', ') || 'N/A'}\n`,
			`School ID: ${userContext.schoolId}\n`,
			`School Name: ${userContext.schoolName}\n`,
		].join('');

		return text;
	}

	private static buildDeviceInfo(userDevice?: UserDeviceProps): string {
		if (!userDevice) {
			return 'No device information provided.';
		}

		const text = [
			`Device User Agent: ${userDevice.deviceUserAgent || 'N/A'}\n`,
			`Browser Name: ${userDevice.browserName || 'N/A'}\n`,
			`Browser Version: ${userDevice.browserVersion || 'N/A'}\n`,
			`Operating System: ${userDevice.os || 'N/A'}\n`,
		].join('');

		return text;
	}

	private static buildContextAndDeviceInfo(
		userContext: UserContextProps,
		userDevice: UserDeviceProps | undefined,
		consent?: boolean
	): string {
		const userContextInfo = this.buildUserContextInfo(userContext);
		const deviceInfo = consent ? this.buildDeviceInfo(userDevice) : 'N/A';

		const text = ['\n--- System Information ---\n', userContextInfo, '\n--- Device Information ---\n', deviceInfo].join(
			''
		);

		return text;
	}
}
