import { Mongoose } from 'mongoose';
import { NewsSchema } from '../schemas/news.schema';

export const newsProviders = [
	{
		provide: 'NEWS_MODEL',
		useFactory: (mongoose: Mongoose) => mongoose.model('News', NewsSchema),
		inject: ['DATABASE_CONNECTION'],
	},
];
