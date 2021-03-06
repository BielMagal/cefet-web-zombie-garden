const express = require('express');
const db = require('../db');
const router = express.Router();

/* GET lista de pessoas. */
router.get('/', (req, res, next) => {

  db.query({
    sql: 'SELECT * FROM person LEFT OUTER JOIN zombie ON eatenBy = zombie.id',
    // nestTables resolve conflitos de haver campos com mesmo nome nas tabelas
    // nas quais fizemos JOIN (neste caso, `person` e `zombie`).
    // descrição: https://github.com/felixge/node-mysql#joins-with-overlapping-column-names
    nestTables: true
  }, (err, rows) => {
      if (err) {
        res.status(500)
          .send('Problema ao recuperar pessoas. Descrição: ' + err);
      }

      // renderiza a view de listagem de pessoas, passando como contexto
      // de dados:
      // - people: com um array de `person`s do banco de dados
      // - success: com uma mensagem de sucesso, caso ela exista
      //   - por exemplo, assim que uma pessoa é excluída, uma mensagem de
      //     sucesso pode ser mostrada
      // - error: idem para mensagem de erro
      res.render('listPeople', {
        people: rows,
        success: req.flash('success'),
        error: req.flash('error')
      });
  });
});


/* PUT altera pessoa para morta por um certo zumbi */
router.put('/eaten/', (req, res) => {
  db.query('UPDATE person ' +
           'SET alive = false, eatenBy = ' + db.escape(req.body.zombie) + ' ' +
           'WHERE id = ' + db.escape(req.body.person),
    (err, result) => {
      if (err) {
        req.flash('error', 'Erro desconhecido. Descrição: ' + err);
      } else if (result.affectedRows !== 1) {
        req.flash('error', 'Nao ha pessoa para ser comida');
      } else {
        req.flash('success', 'A pessoa foi inteiramente (nao apenas cerebro) engolida.');
      }
      res.redirect('/');
  });
});


/* GET formulario de registro de nova pessoa */
router.get('/new/', (req, res) => {
  res.render('newPerson');
});




/* POST registra uma nova pessoa */
// Exercício 1: IMPLEMENTAR AQUI
// Dentro da callback de tratamento da rota:
//   1. Fazer a query de INSERT no banco
//   2. Redirecionar para a rota de listagem de pessoas
//      - Em caso de sucesso do INSERT, colocar uma mensagem feliz
//      - Em caso de erro do INSERT, colocar mensagem vermelhinha

router.post('/', (req, res) => {
  console.log(req.body.name.length);
  if(req.body.name.length == 0){
    req.flash('error', 'Uma pessoa precisa ter um nome, por mais estranho que ele seja...');
    res.redirect('/people');
  }else{
    db.query('INSERT INTO zombies.person(name, alive, eatenBy) VALUES (\'' +
      req.body.name + '\',1,null);',
      (err, result) => {
        if (err) {
          req.flash('error', 'Erro desconhecido. Pessoa não inserida: ' + err);
        } else {
          req.flash('success', 'A pessoa entrou no cemitério.');
        }
        res.redirect('/people');
    });
  }
});

/* DELETE uma pessoa */
// Exercício 2: IMPLEMENTAR AQUI
// Dentro da callback de tratamento da rota:
//   1. Fazer a query de DELETE no banco
//   2. Redirecionar para a rota de listagem de pessoas
//      - Em caso de sucesso do INSERT, colocar uma mensagem feliz
//      - Em caso de erro do INSERT, colocar mensagem vermelhinha

router.delete('/:id', (req, res) => {
  db.query('DELETE from zombies.person where id=\'' +
    req.params.id + '\';',
    (err, result) => {
      if (err) {
        req.flash('error', 'Erro desconhecido. Pessoa não saiu do cemitério: ' + err);
      } else if (result.affectedRows !== 1) {
        req.flash('error', 'Não há essa pessoa no cemitério.');
      } else {
        req.flash('success', 'A pessoa conseguiu sair do cemitério.');
      }
      res.redirect('/people');
  });
});

/* POST transforma um zumbi novamente em uma pessoa */
router.post('/rescue', (req, res) => {
  // busca nome do zumbi mordiscado
  // recriar a pessoa a partir do seu nome antigo
  // e excluir o zumbi
  console.log("ID: " + db.escape(req.body.zombie).toString());
  if(req.body.zombie == '1'){
    req.flash('error', 'Humano tolo! Eu sou o Mestre Zumbie! Jamais me tornarei um humano.');
    res.redirect('/');
  }
  else{
    db.query('SELECT previousName FROM zombies.zombie WHERE id = ' + db.escape(req.body.zombie),
      (err, result) => {
        if (err) {
          res.status(500).send('Erro ao realizar a mordida da salvação. Acho que esse não tenha volta.');
          return;
        }
        if (typeof result[0] === 'undefined') {
          req.flash('error', 'Zumbie nao encontrado!');
          res.redirect('/');
          return;
        }
        const name = result[0].previousName;
        db.query('INSERT INTO zombies.person(name, alive, eatenBy) VALUES (\'' +
        name + '\',1,null);',
          (err, result) => {
            if (err) {
              res.status(500).send('Erro ao realizar a mordida da salvação. Acho que esse não tenha volta.');
              return;
            }
            db.query('DELETE FROM zombies.zombie WHERE id = ' + req.body.zombie,
              (err, result) => {
                if (err) {
                  res.status(500).send('Erro ao realizar a mordida da salvação. Acho que esse não tenha volta.');
                  return;
                }

                req.flash('peopleCountChange', '+1');
                req.flash('zombieCountChange', '-1');
                req.flash('success', 'Mordida da salvação! Zumbi recuperado e se tornou novamente: ' + name);
                res.redirect('/');
              });
          });

      });
  }
});

module.exports = router;
