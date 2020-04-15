const express = require('express');
const PORT = process.env.PORT || 5000;

const {Pool} = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
pool.connect()
    .then(client => client.query('CREATE TABLE IF NOT EXISTS confessions (id SERIAL PRIMARY KEY, text TEXT, uid TEXT, times_reacted INTEGER DEFAULT 0)'))
    .catch(err => console.error("Couldn't create confessions table.", err));

const bodyParser = require('body-parser');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sender = process.env.SENDER;

const twilioClient = require('twilio')(accountSid, authToken);

app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/confession', async (req, res) => {
    const memory = JSON.parse(req.body.Memory);
    const text = memory.twilio.collected_data.collect_confession.answers.confession.answer;
    const uid = req.body.UserIdentifier;
    try {
        const client = await pool.connect();
        const queryText = 'INSERT INTO confessions(text, uid) VALUES($1, $2)';
        const values = [text, uid];
        await client.query(queryText, values);
        console.info("A confession has been saved.");
        let respObj = {
            "actions": [
                {
                    "redirect": "task://confirm_confession_submitted"
                }
            ]
        };
        res.send(respObj);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/confession', async (req, res) => {
    try {
        const client = await pool.connect();
        // select a confession which has the least reactions
        const result = await client.query('SELECT * FROM confessions ORDER BY times_reacted ASC LIMIT 1;');
        let task;
        let message;
        let id = "";
        if (result.rows.length === 0) {
            task = "no_confessions";
            message = "I am sorry, it looks like there are no confessions to be reacted upon. Please try it again later."
        } else {
            task = "expect_reaction";
            let row = result.rows[0];
            message = "Someone said: \n\"" + row.text + "\"";
            id = row.id;
            console.info("key: " + row.id + "\ntext: " + row.text + "\nuserID: " + row.uid);
        }
        let respObj = {
            "actions": [
                {
                    "say": message
                },
                {
                    "remember": {
                        "id": id
                    }
                },
                {
                    "redirect": "task://" + task
                }
            ]
        };
        res.send(respObj);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.post('/reaction', async (req, res) => {
    const memory = JSON.parse(req.body.Memory);
    try {
        const recipientId = memory.id;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM confessions WHERE id=$1;', [recipientId]);
        const row = result.rows[0];
        const reaction = memory.twilio.collected_data.collect_reaction.answers.reaction.answer;
        const recipient = row.uid;
        twilioClient.messages
            .create({
                body: 'Someone reacted to your confession:\n\"' + reaction + "\"",
                from: sender,
                to: recipient
            })
            .then(message => console.info("A reaction has been sent to " + recipient));

        await client.query('UPDATE confessions SET times_reacted = times_reacted + 1 WHERE id=$1;', [recipientId]);
        console.info("A row with id " + recipientId + " has been incremented");

        let respObj = {
            "actions": [
                {
                    "redirect": "task://confirm_reaction_submitted"
                }
            ]
        };
        res.send(respObj);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.listen(PORT, () => console.info(`Listening on ${PORT}`));




