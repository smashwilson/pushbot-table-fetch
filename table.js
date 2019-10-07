const pg = require('pg-promise')()

// wat

class Table {
  constructor (name, columns) {
    this.name = name
    this.columnNames = columns
    this.columnSet = new pg.helpers.ColumnSet(
      this.columnNames,
      {table: this.name}
    )
  }

  getSelectStatement () {
    return `SELECT ${this.columnNames.join(', ')} FROM ${this.name}`
  }

  getInsertStatement (rows) {
    return pg.helpers.insert(rows, this.columnSet)
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

  async move (fromDb, toDb) {
    console.log(`truncating destination table ${this.name}`)
    await this.truncate(toDb)
    console.log(`reading from source table`)
    const rows = await this.select(fromDb)
    console.log(`inserting ${rows.length} into destination table`)
    return this.insert(toDb, rows)
  }
}

class DocumentSetTables {
  constructor (name) {
    this.documentTable = new Table(
      `${name}_documents`,
      ['id', 'created', 'updated', 'submitter', 'body']
    )

    this.attributeTable = new Table(
      `${name}_attributes`,
      ['id', 'document_id', 'kind', 'value']
    )
  }

  async move (fromDb, toDb) {
    await this.documentTable.move(fromDb, toDb)
    await this.attributeTable.move(fromDb, toDb)
  }
}

module.exports = {
  DocumentSetTables
}
