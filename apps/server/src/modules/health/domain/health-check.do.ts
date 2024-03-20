export class HealthCheck {
	id: string;

	updatedAt: Date;

	constructor(id: string, updatedAt: Date) {
		this.id = id;
		this.updatedAt = updatedAt;
	}
}
