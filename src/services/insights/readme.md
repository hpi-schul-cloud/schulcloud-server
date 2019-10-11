# Insights API

### Allowed HTTPs requests:
``GET ``
### Description Of Usual Server Responses:
200 `OK`
401 `Unauthorized`
404 `Not found`



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
thisWeek: String, 
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
monday: String, 
tuesday: String,
wednesday: String,
thursday: String,
friday: String,
saturday: String,
sunday: String
}
```
NB: will return `null` if no count from specific day
Status 200 `OK`

