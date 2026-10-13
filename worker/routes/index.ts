// Rotas da API, separadas por assunto. Cada arquivo registra as suas rotas no
// apiRouter ao ser importado; a ordem abaixo é a ordem em que elas são testadas.
import './auth';
import './beneficiarios';
import './voluntarios';
import './migracao';
import './conteudo';
import './painel';
import './doacoes';
import './emails';

export { apiRouter } from './router';
