import { HelpdeskProblemProps, HelpdeskSystemProps, HelpdeskWishProps, UserDeviceProps } from '../interface';

export class TextMapper {
	public static createFeedbackText(
		problemProps: HelpdeskProblemProps,
		systemProps: HelpdeskSystemProps,
		deviceProps?: UserDeviceProps
	): string {
		const systemInfo = this.buildSystemInfo(systemProps);
		const deviceInfo = problemProps.consent ? this.buildDeviceInfo(deviceProps) : 'N/A';

		let text = `Helpdesk Problem Submission\n\n`;
		text += `--- Problem Details ---\n`;
		text += this.buildProblemDescription(problemProps);
		text += `\n--- System Information ---\n`;
		text += systemInfo;
		text += `\n--- Device Information ---\n`;
		text += deviceInfo;

		return text;
	}

	public static createWishText(
		wishProps: HelpdeskWishProps,
		systemProps: HelpdeskSystemProps,
		deviceProps?: UserDeviceProps
	): string {
		const systemInfo = this.buildSystemInfo(systemProps);
		const deviceInfo = wishProps.consent ? this.buildDeviceInfo(deviceProps) : 'N/A';

		let text = `Helpdesk Wish Submission\n\n`;
		text += `--- Wish Details ---\n`;
		text += this.buildWishDescription(wishProps);
		text += `\n--- System Information ---\n`;
		text += systemInfo;
		text += `\n--- Device Information ---\n`;
		text += deviceInfo;

		return text;
	}

	public static buildWishDescription(wishProps: HelpdeskWishProps): string {
		let details = `Subject: ${wishProps.subject}\n`;
		details += `Problem Area: ${wishProps.problemArea.join(', ')}\n`;
		details += `Role: ${wishProps.role}\n`;
		details += `Desire: ${wishProps.desire}\n`;
		details += `Benefit: ${wishProps.benefit}\n`;
		if (wishProps.acceptanceCriteria) {
			details += `Acceptance Criteria: ${wishProps.acceptanceCriteria}\n`;
		}

		return details;
	}

	public static buildProblemDescription(problemProps: HelpdeskProblemProps): string {
		let details = `Subject: ${problemProps.subject}\n`;
		details += `Problem Area: ${problemProps.problemArea.join(', ')}\n`;
		details += `Problem Description: ${problemProps.problemDescription}\n`;
		if (problemProps.device) {
			details += `Device: ${problemProps.device}\n`;
		}

		return details;
	}

	public static buildSystemInfo(systemProps?: HelpdeskSystemProps): string {
		if (!systemProps) {
			return 'No system information provided.';
		}

		let info = `User ID: ${systemProps.userId}\n`;
		info += `User Name: ${systemProps.userName}\n`;
		info += `User Email: ${systemProps.userEmail}\n`;
		info += `User Roles: ${systemProps.userRoles?.join(', ') || 'N/A'}\n`;
		info += `School ID: ${systemProps.schoolId}\n`;
		info += `School Name: ${systemProps.schoolName}\n`;

		return info;
	}

	public static buildDeviceInfo(deviceProps?: UserDeviceProps): string {
		if (!deviceProps) {
			return 'No device information provided.';
		}

		let info = `Device User Agent: ${deviceProps.deviceUserAgent || 'N/A'}\n`;
		info += `Browser Name: ${deviceProps.browserName || 'N/A'}\n`;
		info += `Browser Version: ${deviceProps.browserVersion || 'N/A'}\n`;
		info += `Operating System: ${deviceProps.os || 'N/A'}\n`;

		return info;
	}
}
