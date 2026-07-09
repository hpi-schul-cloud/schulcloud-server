import { type Group } from '../group';

export class GroupDeletedEvent {
	public target: Group;

	constructor(target: Group) {
		this.target = target;
	}
}
