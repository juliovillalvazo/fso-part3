require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');
const { response } = require('express');

morgan.token('dataSent', function dataSent(req) {
    const data = JSON.stringify(req.body);
    if (data) return JSON.stringify(req.body);
    return null;
});

app.use(express.json());
app.use(express.static('build'));
app.use(
    morgan(
        ':method :url :status :res[content-length] - :response-time :dataSent'
    )
);

app.use(cors());

app.get('/api/persons', (req, res) => {
    Person.find({}).then((people) => {
        res.json(people);
    });
});

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then((person) => {
            if (person) {
                res.json(person);
            } else {
                res.status(404).end();
            }
        })
        .catch((error) => next(error));
});

app.get('/info', (req, res) => {
    const date = new Date();
    Person.find({})
        .then((all) => {
            res.send(`<div>
        <p>Phonebook has info for ${all.length} people</p>
        <p>${date}</p>
        </div>`);
        })
        .catch((error) => next(error));
});

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndRemove(req.params.id)
        .then((result) => {
            res.status(204).end();
        })
        .catch((error) => next(error));
});

app.post('/api/persons', (req, res) => {
    const body = req.body;
    console.log(body);

    if (!body || !body.name || !body.number) {
        return res.status(400).json({ error: 'the name or number is missing' });
    }

    const newEntry = new Person({
        name: body.name,
        number: body.number,
    });

    newEntry.save().then((savedPerson) => {
        res.json(savedPerson);
    });
});

app.put('/api/persons/:id', (req, res, next) => {
    const body = req.body;

    const person = {
        name: body.name,
        number: body.number,
    };

    Person.findByIdAndUpdate(req.params.id, person, { new: true })
        .then((updatedPerson) => {
            res.json(updatedPerson);
        })
        .catch((error) => next(error));
});

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
    console.log(error.message);

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' });
    }

    next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
