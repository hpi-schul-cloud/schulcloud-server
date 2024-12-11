export class ComponentEtherpadPropsDto {
	description: string;

	title: string;

	url: string;

	constructor(props: Readonly<ComponentEtherpadPropsDto>) {
		this.description = props.description;
		this.title = props.title;
		this.url = props.url;
	}
}
