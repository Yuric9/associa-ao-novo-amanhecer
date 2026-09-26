// Adaptador fino sobre o D1 com a mesma "cara" do antigo node:sqlite
// (prepare(...).get / .all / .run), só que assíncrono.

type Param = string | number | null | boolean | undefined;

function clean(params: Param[]): (string | number | null)[] {
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

export class Statement {
  constructor(private readonly stmt: D1PreparedStatement) {}

  /** Primeira linha ou undefined. */
  async get<T = any>(...params: Param[]): Promise<T | undefined> {
    const row = await this.stmt.bind(...clean(params)).first<T>();
    return row ?? undefined;
  }

  /** Todas as linhas. */
  async all<T = any>(...params: Param[]): Promise<T[]> {
    const result = await this.stmt.bind(...clean(params)).all<T>();
    return result.results ?? [];
  }

  /** Executa INSERT/UPDATE/DELETE. */
  async run(...params: Param[]) {
    return this.stmt.bind(...clean(params)).run();
  }

  /** Versão já com parâmetros, para usar em db.batch([...]) (transação atômica). */
  bind(...params: Param[]): D1PreparedStatement {
    return this.stmt.bind(...clean(params));
  }
}

class Database {
  private d1: D1Database | null = null;

  attach(d1: D1Database) {
    this.d1 = d1;
  }

  private get raw(): D1Database {
    if (!this.d1) throw new Error('Banco D1 não conectado (binding "DB" ausente no wrangler.jsonc).');
    return this.d1;
  }

  prepare(sql: string): Statement {
    return new Statement(this.raw.prepare(sql));
  }

  /** Executa vários comandos numa única transação: ou todos são aplicados, ou nenhum. */
  async batch(statements: D1PreparedStatement[]) {
    if (statements.length === 0) return [];
    return this.raw.batch(statements);
  }
}

export const db = new Database();
