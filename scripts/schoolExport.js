/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const lodash = require('lodash');
const { ObjectId } = require('mongoose').Types;
const fs = require('fs').promises;
const fsSync = require('fs');
const appPromise = require('../src/app');
const { schoolModel } = require('../src/services/school/model');
const { FileModel } = require('../src/services/fileStorage/model');
const { userModel } = require('../src/services/user/model');
const { teamsModel } = require('../src/services/teams/model');
const accountModel = require('../src/services/account/model');
const { courseModel, courseGroupModel, classModel } = require('../src/services/user-group/model');
const ltiToolModel = require('../src/services/ltiTool/model');
const { LessonModel } = require('../src/services/lesson/model');
const passwordRecoveryModel = require('../src/services/passwordRecovery/model');
const {
	userModel: rocketChatUserModel,
	channelModel: rocketChatChannelModel,
} = require('../src/services/rocketChat/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

const exportSchool = async (schoolId) => schoolModel.findById(schoolId).exec();

const exportCourses = (schoolId) => courseModel.collection.find({ schoolId: ObjectId(schoolId) }).toArray();

const exportUsers = async (schoolId) => userModel.find({ schoolId }).exec();

const exportAccounts = async (userId) => accountModel.findOne({ userId }).exec();

const exportTeams = async (schoolId) => teamsModel.find({ schoolId }).exec();

const exportTeamFiles = async (teamId) => FileModel.find({ owner: teamId, refOwnerModel: 'teams' }).exec();

const exportCourseFiles = async (courseId) => FileModel.find({ owner: courseId, refOwnerModel: 'course' }).exec();

const exportUserFiles = async (userId) => FileModel.find({ owner: userId, refOwnerModel: 'user' }).exec();

const exportCourseGroups = async (courseId) => courseGroupModel.find({ courseId }).exec();

const exportLtiTools = async (ltiToolIds) => ltiToolModel.find({ _id: { $in: ltiToolIds } }).exec();

const exportLessons = async (courseId) => LessonModel.find({ courseId }).exec();

const exportPasswordRecoveries = async (accountId) => passwordRecoveryModel.find({ account: accountId }).exec();

const exportRocketChatUsers = async (userId) => rocketChatUserModel.findOne({ userId }).exec();

const exportRocketChatChannels = async (teamId) => rocketChatChannelModel.findOne({ teamId }).exec();

const exportClasses = async (schoolId) => classModel.find({ schoolId }).exec();

const exportHomework = async (schoolId) => homeworkModel.find({ schoolId }).exec();

const exportSubmissions = async (schoolId) => submissionModel.find({ schoolId }).exec();

const exportNews = async (schoolId) => newsModel.find({ schoolId }).exec();

const exportErrors = [];
const validateSchema = async (document, model) => {
	model
		.validate(document, null, document)
		.then(() => true)
		.catch((err) => {
			exportErrors.push(err.message);
			exportErrors.push(document._id);
			return false;
		});
};

async function writeUserFiles(entityName, outerEntities, getFilesForEntity, destinationFileName) {
    const stream = fsSync.createWriteStream(destinationFileName, {flags: 'a'})
    stream.write('[')

    let outerCounter = 0;
    const outerTotalLength = outerEntities.length +1;

    for (const outer of outerEntities) {
        outerCounter++;
        console.log('' + outerCounter + ' / ' + outerTotalLength + ' ' + entityName + ' files');
        const files = await getFilesForEntity(outer._id);

        const filesTotalLength = files.length +1 ;
        let innerCounter = 0;
        files
            .flat()
            .forEach(innerFile => {
                innerCounter++;
                if (innerFile !== null && innerFile !== '' && validateSchema(innerFile, FileModel)) {

                    stream.write(JSON.stringify(innerFile));
                    if (filesTotalLength !== innerCounter && outerTotalLength !== outerCounter) {
                        stream.write(',')
                    }
                }

            });
    }
    stream.write(']');
    stream.close();
}

appPromise
	.then(async () => {
		const targetDirectory = process.argv[3];
		await fs.mkdir(targetDirectory)

		const fullJson = {
			school: {},
			courses: [],
			users: [],
			accounts: [],
			teams: [],
			courseGroups: [],
			ltiTools: [],
			lessons: [],
			passwordRecoveries: [],
			rocketChatUsers: [],
			rocketChatChannels: [],
			classes: [],
			homework: [],
			news: [],
			submissions: [],
		};

		const schoolId = process.argv[2];
		const users = (await exportUsers(schoolId)).filter((el) => validateSchema(el, userModel));
		const accounts = (await Promise.all(users.map((u) => exportAccounts(u._id)))).filter(
			(el) => el !== null && validateSchema(el, accountModel)
		);
		const teams = (await exportTeams(schoolId)).filter((el) => validateSchema(el, teamsModel));
		const courses = (await exportCourses(schoolId)).filter((el) => validateSchema(el, courseModel));
		const courseGroups = (await Promise.all(courses.map((c) => exportCourseGroups(c._id))))
			.flat()
			.filter((el) => el !== null && el !== '' && validateSchema(el, courseGroupModel));
		const ltiTools = (await Promise.all(courses.map((c) => exportLtiTools(c.ltiToolIds))))
			.flat()
			.filter((el) => el !== null && el !== '' && validateSchema(el, ltiToolModel));
		const lessons = (await Promise.all(courses.map((c) => exportLessons(c._id))))
			.flat()
			.filter((el) => el !== null && el !== '' && validateSchema(el, LessonModel));
		const passwordRecoveries = (await Promise.all(accounts.map((a) => exportPasswordRecoveries(a._id))))
			.flat()
			.filter((el) => el !== null && el !== '' && validateSchema(el, passwordRecoveryModel));
		const rocketChatUsers = (await Promise.all(users.map((u) => exportRocketChatUsers(u._id)))).filter(
			(el) => el !== null && validateSchema(el, rocketChatUserModel)
		);
		const rocketChatChannels = (await Promise.all(teams.map((t) => exportRocketChatChannels(t._id)))).filter(
			(el) => el !== null && validateSchema(el, rocketChatChannelModel)
		);
		const classes = (await exportClasses(schoolId)).filter((el) => validateSchema(el, classModel));
		const homework = (await exportHomework(schoolId)).filter((el) => validateSchema(el, homeworkModel));
		const news = (await exportNews(schoolId)).filter((el) => validateSchema(el, newsModel));
		const submissions = (await exportSubmissions(schoolId)).filter((el) => validateSchema(el, submissionModel));

		fullJson.school = (await exportSchool(schoolId)).toJSON();
		validateSchema(fullJson.school, schoolModel);
		fullJson.courses = lodash.uniqBy(courses, (e) => e._id.toString());
		fullJson.teams = lodash.uniqBy(teams, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.users = lodash.uniqBy(users, (e) => e._id.toString());
		fullJson.accounts = lodash.uniqBy(accounts, (e) => e._id.toString()).map((a) => a.toJSON());
		fullJson.files = lodash.uniqBy(fullJson.files, (e) => e._id.toString());
		fullJson.courseGroups = lodash.uniqBy(courseGroups, (e) => e._id.toString());
		fullJson.ltiTools = lodash.uniqBy(ltiTools, (e) => e._id.toString());
		fullJson.lessons = lodash.uniqBy(lessons, (e) => e._id.toString());
		fullJson.passwordRecoveries = lodash.uniqBy(passwordRecoveries, (e) => e._id.toString());
		fullJson.rocketChatUsers = lodash.uniqBy(rocketChatUsers, (e) => e._id.toString()).map((u) => u.toJSON());
		fullJson.rocketChatChannels = lodash.uniqBy(rocketChatChannels, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.classes = lodash.uniqBy(classes, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.homework = lodash.uniqBy(homework, (e) => e._id.toString()).map((h) => h.toJSON());
		fullJson.news = lodash.uniqBy(news, (e) => e._id.toString()).map((n) => n.toJSON());
		fullJson.submissions = lodash.uniqBy(submissions, (e) => e._id.toString()).map((s) => s.toJSON());

		if (exportErrors.length > 0) {
			console.log(exportErrors);
			return process.exit(1);
		}
		console.log('start exporting files')

        await writeUserFiles('user', users, exportUserFiles, targetDirectory + '/userFiles.json');
        await writeUserFiles('course', courses, exportCourseFiles, targetDirectory + '/courseFiles.json');
        await writeUserFiles('team', teams, exportTeamFiles, targetDirectory + '/teamFiles.json');

        const fullJsonString = JSON.stringify(fullJson);

        await fs.writeFile(targetDirectory + "/main.json", fullJsonString);
        console.log(exportErrors);
        return process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        return process.exit(1);
    });
