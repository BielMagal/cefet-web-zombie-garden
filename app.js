const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')
const flash = require('connect-flash');
const db = require('./db');
const dbUtils = require('./dbUtils');

// a definição das rotas de cada "entidade" está isolada em seu próprio arquivo
// de forma a tornar o código do projeto organizado
const routes = require('./routes/index');
const people = require('./routes/people');
const zombies = require('./routes/zombies');


const app = express();

// configura a pasta que contém as views e o handlebars como templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// possibilita enviar um DELETE via formulário,
// quando é um POST com ?_method=DELETE na querystring
//
// isto é necessário porque formulários aceitam apenas GET e POST
app.use(methodOverride('_method', { methods: ['GET', 'POST'] }));
app.use(favicon(__dirname + '/public/images/zombie1.jpg'));
app.use(logger('dev'));                                   // registra tudo no terminal
app.use(bodyParser.json());                               // required pra POST, PUT, PATCH etc.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({                                         // required para flash()
  secret: 'lalala',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());                                         // required para msgs efêmeras
app.use(express.static(path.join(__dirname, 'public')));  // serve arquivos estáticos

// configura as rotas "de cada entidade" da aplicação (separadinho, organizado)
app.use('/', routes);
app.use('/people', people);
app.use('/zombies', zombies);
app.use('/db/reset', (req, res) => {
  dbUtils.resetDb((error) => {
      req.flash('error', errorMessage);
    }, () => {
      req.flash('success', 'Banco de dados restaurado ao estado original');
      res.redirect('/');
    });
});

// uma rota "catch-all" para erros de caminho inexistente
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// handler de erros
// apenas imprime a stacktrace em ambientes de dev
app.use((err, req, res, next) => {
  let error = {};
  if (app.get('env') === 'development')
    error = err;
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error
    });
});


module.exports = app;
