#!/usr/bin/env node

const program = require('commander')
const pg = require('pg-promise')()
const {DocumentSetTables, brainTable} = require('./table')

function collect(val, memo) {
  memo.push(val)
  return memo
}

program
  .version('1.0.0')
  .option('-f, --from [url]', 'connection URL for source database')
  .option('-t, --to [url]', 'connection URL for destination database')
  .option('--ds [documentset]', 'document set to replicate', collect, [])
  .option('--brain', 'replicate the brain')
  .parse(process.argv)

if (!program.from) {
  program.from = process.env.DB_FROM
}

if (!program.to) {
  program.to = process.env.DB_TO
}

const fromDb = pg(program.from)
const toDb = pg(program.to)

const tables = []
for (const dsName of program.ds) {
  tables.push(new DocumentSetTables(dsName))
}
if (program.brain) {
  tables.push(brainTable)
}

const ds = new DocumentSetTables(program.ds)

async function go() {
  console.log(`Fetching ${tables.length} tables ...`)
  await Promise.all(tables.map(t => t.move(fromDb, toDb)))
  console.log('done')
}

go().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
