module.exports = function(app){
    var musicians = require('./controllers/musicians');
    var users = require('./controllers/users');
    var topsis = require('./controllers/topsis');

    app.get('/musicians', musicians.findAll);
    app.get('/import', musicians.import);
    app.get('/musicians/:id', musicians.findById);

    app.get('/users/:id', users.findById);
    app.post('/users/:id', users.update);
};