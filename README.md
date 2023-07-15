# Penguin
A server which aggregates and caches git-provider (currently just Gitlab) information

## TODO

P0

* Durable but non-dynamo repository. Local disk would probably be good enough
* New dbs, add to dynamo
* "stardard" middleware, at least:
  * AuthZ (authZ used to check JWT Claim)
    * One which just checks configured JWT claim
    * One which uses the registered git provider Oauth
      * Then, confirm they have maintainer/guest (not sure which, I think most is guest and deployments are maintainer?) to the groups in the config
      * Use a representative user's token instead of configured god token. Maybe just set it up as the config "owner"
    * One which uses a list of configured users who are allows to pair by email
      * Same confirmation of maintainer/guest access
  * error handling, was @cimpress-technology/belterrorhandling
  * Logging
* Refresh git provider tokens
* More gracefully skip newrelic
* More gracefully skip AWS ML
* Set rp timeouts higher
* Use a real cache in ./src/clients/clientbuilder
* publish docker image
* CORS

P1

* This README. How to build, run, and deploy
* Show reviewers
* Strategy pattern for bitbucket and github
* Show the scoring algorithm. Add exclude list of users
* don't use app.locals.gitlabclient in any routes. Just for polling
* Upload a token instead of using oauth
* Notifications from gitprovider on need to refresh instead of polling
* Anything commented out in the config. These are nice to haves
* Get ML working without AWS. And write down how to get it working with AWS
* Get newrelic working behind an interface for other APM solutions
* Get the cimpress.yaml config in a better place for reintegrating for Cimpress.
  * Loading newrelic monitoring into the app and poller, see comment in app.js and pollers/poll.js
* Upgrade dependencies.
* Smoke tests
* Get the poller to trigger immediately on a new config
* Add new preferences methods to customizr