export class ComponentEtherpadPropsDto {
	public description: string;

	public title: string;

	public url: string;

	constructor(props: Readonly<ComponentEtherpadPropsDto>) {
		this.description = props.description;
		this.title = props.title;
		this.url = props.url;
	}
}
