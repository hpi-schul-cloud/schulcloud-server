# Insights API
[Official API docs](http://localhost:3030/docs/#/insights)
### Allowed HTTPs requests:
``GET ``
### Description Of Usual Server Responses:
200 `OK` 

401 `Unauthorized`
## Monthly Users 
`/insights/monthlyUsers`
`GET`

expected result:
```
{
thisMonth: String, // eg: "42"
lastMonth: String
}
```
Status 200 `OK`

## Weekly Users
`/insights/weeklyUsers`
`GET`

expected result:
```
{
thisWeek: String, // eg: "42"
lastWeek: String
}
```
Status 200 `OK`
## Weekly Activity 
`/insights/weeklyActivity`
`GET`
expected result:
```
{
monday: String, // eg: "42"
tuesday: String,
wednesday: String,
thursday: String,
friday: String,
saturday: String,
sunday: String
}
```
Status 200 `OK`
## Weekly Active Users
`/insights/weeklyActiveUsers`
`GET`
expected result:
```
{
teacherUsers: Number,
studentUsers: Number,
activeStudents: String,
activeTeachers, String,
activeStudentPercentage: String,
activeTeacherPercentage: String
}
```
Status 200 `OK`
NB:  `activeStudentPercentage` and `activeTeacherPercentage` will return `NaN` or `Infinity` if trying to calculate percentage of 0.

## Role Activity 
`/insights/roleActivity`
`GET`
expected result:
```
{
teacherData: String, // eg: "42"
studentData: String
}
```
Status 200 `OK`


## Dau Over Mau
`/insights/dauOverMau`
`GET`
expected result:
```
{
teacher: String, // eg: "42.1337"
}
```
Status 200 `OK`

NB: All values will return `null` if no data

Feedback can be sent to tormod.flesjo@hpi.de