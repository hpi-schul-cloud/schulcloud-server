export class HealthCheck {
	public id: string;

	public updatedAt: Date;

	constructor(id: string, updatedAt: Date) {
		this.id = id;
		this.updatedAt = updatedAt;
	}
}
