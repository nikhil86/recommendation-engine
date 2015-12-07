module.exports = function(app){
    var users = require('./controllers/users');
    var topsis = require('./controllers/topsis');


    app.get('/users/:id', users.findById);
    app.get('/ancillaries/:id', users.getAncillaries);
    app.post('/users/:id', users.update);
    app.post('/flights/:id', users.updateFlights);
    app.post('/preference/:id', users.updatePreference);

    app.post('/topsis/:id', topsis.sort);
};