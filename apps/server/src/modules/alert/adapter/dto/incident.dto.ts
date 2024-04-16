export class IncidentDto {
	constructor(
		id: number,
		component_id: number,
		name: string,
		status: number,
		message: string,
		created_at: Date,
		updated_at: Date,
		deleted_at: Date,
		visible: number,
		stickied: boolean,
		occurred_at: Date,
		user_id: number,
		notifications: boolean,
		is_resolved: boolean,
		human_status: string,
		latest_update_id: number,
		latest_status: number,
		latest_human_status: string,
		latest_icon: string,
		permalink: string,
		duration: number
	) {
		this.id = id;
		this.component_id = component_id;
		this.name = name;
		this.status = status;
		this.message = message;
		this.created_at = created_at;
		this.updated_at = updated_at;
		this.deleted_at = deleted_at;
		this.visible = visible;
		this.stickied = stickied;
		this.occurred_at = occurred_at;
		this.user_id = user_id;
		this.notifications = notifications;
		this.is_resolved = is_resolved;
		this.human_status = human_status;
		this.latest_update_id = latest_update_id;
		this.latest_status = latest_status;
		this.latest_human_status = latest_human_status;
		this.latest_icon = latest_icon;
		this.permalink = permalink;
		this.duration = duration;
	}

	id: number;

	component_id: number;

	name: string;

	status: number;

	message: string;

	created_at: Date;

	updated_at: Date;

	deleted_at: Date;

	visible: number;

	stickied: boolean;

	occurred_at: Date;

	user_id: number;

	notifications: boolean;

	is_resolved: boolean;

	human_status: string;

	latest_update_id: number;

	latest_status: number;

	latest_human_status: string;

	latest_icon: string;

	permalink: string;

	duration: number;
}
