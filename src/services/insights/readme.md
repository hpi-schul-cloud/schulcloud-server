# Insights API

### Allowed HTTPs requests:
``GET ``
### Description Of Usual Server Responses:
200 `OK`
401 `Unauthorized`
## Monthly Users 
##### One sentence explanation here
`/insgihts/monthlyUsers`
`GET`
expected result:
```
{
thisWeek: String, // eg: "42"
lastWeek: String
}
```
Status 200 `OK`

## Weekly Users
##### One sentence explanation here
`/insgihts/weeklyUsers`
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
##### One sentence explanation here
`/insgihts/weeklyActivity`
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
##### One sentence explanation here
`/insgihts/weeklyActiveUsers`
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
NB:  `activeStudentPercentage` and `activeTeacherPercentage` will return `NaN` if trying to calculate percentage of 0.

## Role Activity 
##### One sentence explanation here
`/insgihts/roleActivity/:schoolId`
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
##### One sentence explanation here
`/insgihts/dauOverMau`
`GET`
expected result:
```
{
teacher: String, // eg: "42"
}
```
Status 200 `OK`

NB: All values will return `null` if no data

Feedback can be sent to tormod.flesjo@hpi.de