export class ComponentDto {
	constructor(
		id: number,
		name: string,
		description: string,
		link: string,
		status: number,
		order: number,
		group_id: number,
		created_at: Date,
		updated_at: Date,
		deleted_at: Date,
		enabled: boolean,
		meta: any[],
		status_name: string,
		tags: any[]
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.link = link;
		this.status = status;
		this.order = order;
		this.group_id = group_id;
		this.created_at = created_at;
		this.updated_at = updated_at;
		this.deleted_at = deleted_at;
		this.enabled = enabled;
		this.meta = meta;
		this.status_name = status_name;
		this.tags = tags;
	}

	id: number;

	name: string;

	description: string;

	link: string;

	status: number;

	order: number;

	group_id: number;

	created_at: Date;

	updated_at: Date;

	deleted_at: Date;

	enabled: boolean;

	meta: any[];

	status_name: string;

	tags: any[];
}
