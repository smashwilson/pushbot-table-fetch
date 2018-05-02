const pg = require('pg-promise')()

class Table {
  constructor (name, columns, hasID) {
    this.name = name
    this.columnNames = columns.map(c => c.name || c)
    this.columnSet = new pg.helpers.ColumnSet(
      columns,
      {table: this.name}
    )
    this.hasID = hasID
  }

  getSelectStatement () {
    return `SELECT ${this.columnNames.join(', ')} FROM ${this.name}`
  }

  getInsertStatement (rows) {
    return pg.helpers.insert(rows, this.columnSet)
  }

  getSequenceStatement (count) {
    return `ALTER SEQUENCE ${this.name}_id_seq RESTART WITH ${count}`
  }

  truncate (db) {
    return db.none(`TRUNCATE TABLE ${this.name} CASCADE`)
  }

  select (db) {
    return db.any(this.getSelectStatement())
  }

  insert (db, rows) {
    return db.none(this.getInsertStatement(rows))
  }

  alterSequence (db, count) {
    return db.none(this.getSequenceStatement(count))
  }

  async move (fromDb, toDb) {
    console.log(`truncating destination table ${this.name}`)
    await this.truncate(toDb)
    console.log(`reading from source table`)
    const rows = await this.select(fromDb)
    console.log(`inserting ${rows.length} into destination table`)
    await this.insert(toDb, rows)
    if (this.hasID) {
      await this.alterSequence(toDb, rows.length)
    }
  }
}

class DocumentSetTables {
  constructor (name) {
    this.documentTable = new Table(
      `${name}_documents`,
      ['id', 'created', 'updated', 'submitter', 'body'],
      true
    )

    this.attributeTable = new Table(
      `${name}_attributes`,
      ['id', 'document_id', 'kind', 'value'],
      true
    )
  }

  async move (fromDb, toDb) {
    await this.documentTable.move(fromDb, toDb)
    await this.attributeTable.move(fromDb, toDb)
  }
}

const brainTable = new Table('brain', ['key', 'type', {name: 'value', mod: ':json'}], false)

module.exports = {
  DocumentSetTables,
  brainTable
}
