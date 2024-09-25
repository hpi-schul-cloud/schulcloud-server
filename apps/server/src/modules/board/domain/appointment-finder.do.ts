import { BoardNode } from './board-node.do';
import type { AppointmentFinderElementProps } from './types';

export class AppointmentFinderElement extends BoardNode<AppointmentFinderElementProps> {
	get appointmentFinderId(): string | undefined {
		return this.props.externalId;
	}

	set appointmentFinderId(value: string) {
		this.props.externalId = value;
	}

	get adminId(): string | undefined {
		return this.props.externalAdminId;
	}

	set adminId(value: string) {
		this.props.externalAdminId = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isAppointmentFinderElement = (reference: unknown): reference is AppointmentFinderElement =>
	reference instanceof AppointmentFinderElement;
