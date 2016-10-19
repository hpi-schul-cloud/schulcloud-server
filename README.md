# SchulCloud

![Travis Status](https://travis-ci.org/schulcloud/schulcloud.svg)

# Requirements

* node.js
* mongoDB

## Setup

1. Clone directory into local folder
2. Go into the cloned folder and enter `npm install`

## Run

1. Go into project folder
2. run `mongod`
2. run `npm start`

## Testing

1. Go into project folder
2. run `npm run test`

## Commiting

1. Go into project folder
2. Run the tests (see above)
3. Commit with a meanigful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
4. Checkout to master branch
5. Run `git pull`
6. Checkout to the branch you want to upload
7. run `git rebase -p master` (not `git merge`!) and solve merge conflicts if needed
