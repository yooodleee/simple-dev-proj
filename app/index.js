//app/index.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'votes.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// primary vote options
const OPTIONS = [
    'Docker', 
    'Kubernetes',
    'Terraform',
    'Jenkins',
    'Prometheus',
    "Grafana"
];

function readVotes() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (err) {
        return {};
    }
}

function saveVote(option) {
    const votes = readVotes();
    votes[option] = (votes[option] || 0) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify(votes));
}

// main page
app.get('/', (req, res) => {
    res.render('index', { options: OPTIONS });
});

// vote process
app.post('/vote', (req, res) => {
    const choice = req.body.choice;
    if (OPTIONS.includes(choice)) {
        saveVote(choice);
    }
    res.redirect('/results');
});

// result page
app.get('/results', (req, res) => {
    const votes = readVotes();
    res.render('results', { votes });
});

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});