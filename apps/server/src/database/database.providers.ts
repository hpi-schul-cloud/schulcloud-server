import * as mongoose from 'mongoose';

export const databaseProviders = [
	{
		provide: 'DATABASE_CONNECTION',
		useFactory: () => {
			//	return await mongoose.connect('mongodb://localhost/schulcloud')
			return mongoose;
		},
	},
];
