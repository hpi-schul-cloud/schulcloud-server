const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars

const { Schema } = mongoose;

const { program } = require('commander');

program.requiredOption('-u, --url <value>', '(Required) URL of the MongoDB instance');
program.parse();

const options = program.opts();
const mongodbUrl = options.url;

const close = async () => mongoose.connection.close();

const connect = async () => {
	const mongooseOptions = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	return mongoose.connect(mongodbUrl, mongooseOptions);
};

const COURSE_FEATURES = {
	VIDEOCONFERENCE: 'videoconference',
};

const LtiTool = mongoose.model(
	'ltiTools1688028372783',
	new mongoose.Schema(
		{
			isTemplate: { type: Boolean },
			name: { type: String },
		},
		{
			timestamps: true,
		}
	),
	'ltitools'
);

const Course = mongoose.model(
	'course1688028372783',
	new mongoose.Schema(
		{
			ltiToolIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'ltiTools1688028372783' }],
			features: [{ type: String, enum: Object.values(COURSE_FEATURES) }],
		},
		{
			timestamps: true,
		}
	),
	'courses'
);

const up = async () => {
	await connect();

	// find all non-template bbb tools
	const bbbTools = await LtiTool.find({
		$and: [{ name: 'Video-Konferenz mit BigBlueButton' }, { isTemplate: false }],
	})
		.lean()
		.exec();

	if ((bbbTools || []).length === 0) {
		console.error('No non-template videoconferences found. Nothing to migrate.');
		return;
	}

	console.log(`Found ${bbbTools.length} tool(s) to migrate.`);

	// find all courses that use BBB
	const coursesWithBbb = await Course.find({ ltiToolIds: { $in: bbbTools } })
		.lean()
		.exec();

	if ((coursesWithBbb || []).length === 0) {
		console.error('No courses with BBB found. Nothing to migrate.');
		return;
	}

	console.log(`Found ${coursesWithBbb.length} course(s) to update.`);

	// add videoconference feature to courses that use bbb
	const addFeature = async () => {
		for (const course of coursesWithBbb) {
			await Course.updateOne(
				{ _id: course._id },
				{ $addToSet: { features: { $each: [COURSE_FEATURES.VIDEOCONFERENCE] } } }
			).exec();
		}
	};
	await addFeature();

	console.log(`Updated ${coursesWithBbb.length} courses.`);

	await close();
};

(async () => {
	try {
		await up();
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
