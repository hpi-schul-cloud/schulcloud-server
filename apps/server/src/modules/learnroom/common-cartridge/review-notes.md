# review 04.12.23

- put all course-independent code into a seperate "common-cartrige" module
- import common-cartrige into learnroom
- adjust all tests to avoid global variables. create factories where useful, and use setup function instead of beforeAll