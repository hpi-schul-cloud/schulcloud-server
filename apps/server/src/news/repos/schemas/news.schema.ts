import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsDocument = News & Document;

@Schema({ collection: 'news' })
export class News {
	@Prop()
	title: string;

	@Prop()
	content: string;

	@Prop()
	createdAt: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
