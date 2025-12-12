import { HelpdeskProblemProps, HelpdeskWishProps, UserContextProps, UserDeviceProps } from '../interface';

export class TextFormatter {
	public static createProblemText(
		problem: HelpdeskProblemProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const userContextInfo = this.buildUserContextInfo(userContext);
		const deviceInfo = problem.consent ? this.buildDeviceInfo(userDevice) : 'N/A';

		let text = `Helpdesk Problem Submission\n\n`;
		text += `--- Problem Details ---\n`;
		text += this.buildProblemDescription(problem);
		text += `\n--- System Information ---\n`;
		text += userContextInfo;
		text += `\n--- Device Information ---\n`;
		text += deviceInfo;

		return text;
	}

	public static createWishText(
		wish: HelpdeskWishProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps
	): string {
		const userContextInfo = this.buildUserContextInfo(userContext);
		const deviceInfo = wish.consent ? this.buildDeviceInfo(userDevice) : 'N/A';

		let text = `Helpdesk Wish Submission\n\n`;
		text += `--- Wish Details ---\n`;
		text += this.buildWishDescription(wish);
		text += `\n--- System Information ---\n`;
		text += userContextInfo;
		text += `\n--- Device Information ---\n`;
		text += deviceInfo;

		return text;
	}

	public static buildWishDescription(wish: HelpdeskWishProps): string {
		let details = `Subject: ${wish.subject}\n`;
		details += `Problem Area: ${wish.problemArea.join(', ')}\n`;
		details += `Role: ${wish.role}\n`;
		details += `Desire: ${wish.desire}\n`;
		details += `Benefit: ${wish.benefit}\n`;
		if (wish.acceptanceCriteria) {
			details += `Acceptance Criteria: ${wish.acceptanceCriteria}\n`;
		}

		return details;
	}

	public static buildProblemDescription(problem: HelpdeskProblemProps): string {
		let details = `Subject: ${problem.subject}\n`;
		details += `Problem Area: ${problem.problemArea.join(', ')}\n`;
		details += `Problem Description: ${problem.problemDescription}\n`;
		if (problem.device) {
			details += `Device: ${problem.device}\n`;
		}

		return details;
	}

	public static buildUserContextInfo(userContext?: UserContextProps): string {
		if (!userContext) {
			return 'No system information provided.';
		}

		let info = `User ID: ${userContext.userId}\n`;
		info += `User Name: ${userContext.userName}\n`;
		info += `User Email: ${userContext.userEmail}\n`;
		info += `User Roles: ${userContext.userRoles?.join(', ') || 'N/A'}\n`;
		info += `School ID: ${userContext.schoolId}\n`;
		info += `School Name: ${userContext.schoolName}\n`;

		return info;
	}

	public static buildDeviceInfo(userDevice?: UserDeviceProps): string {
		if (!userDevice) {
			return 'No device information provided.';
		}

		let info = `Device User Agent: ${userDevice.deviceUserAgent || 'N/A'}\n`;
		info += `Browser Name: ${userDevice.browserName || 'N/A'}\n`;
		info += `Browser Version: ${userDevice.browserVersion || 'N/A'}\n`;
		info += `Operating System: ${userDevice.os || 'N/A'}\n`;

		return info;
	}
}
