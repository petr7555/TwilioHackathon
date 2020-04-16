# TwilioHackathon 2020 chat bot app

A chat bot that connects people who submit confessions with people who answer them.

See [post on DEV]().

## Deploying to Heroku

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

You need an underlying Twilio Autopilot that uses endpoints in `index.js`.

After integrating the Autopilot with WhatsApp, set SENDER variable.

You need to [specify environment variables](https://devcenter.heroku.com/articles/config-vars):

```
TWILIO_ACCOUNT_SID=************************
TWILIO_AUTH_TOKEN=*************************
SENDER=whatsapp:+123456789
```

```sh
$ git clone https://github.com/petr7555/TwilioHackathon.git # or clone your own fork
$ cd TwilioHackathon
$ npm install
$ heroku login
$ heroku create
$ git push heroku master
$ heroku open
```