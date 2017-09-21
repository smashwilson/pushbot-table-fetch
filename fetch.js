const program = require('commander')
const pg = require('pg-promise')()
const {DocumentSetTables} = require('./table')

program
  .version('1.0.0')
  .option('-f, --from [url]', 'connection URL for source database')
  .option('-t, --to [url]', 'connection URL for destination database')
  .option('--ds [documentset]', 'document set to replicate')
  .parse(process.argv)

if (!program.from) {
  program.from = process.env.DB_FROM
}

if (!program.to) {
  program.to = process.env.DB_TO
}

const fromDb = pg(program.from)
const toDb = pg(program.to)
const ds = new DocumentSetTables(program.ds)

async function go() {
  console.log(`Fetching ${program.ds} ...`)
  await ds.move(fromDb, toDb)
  console.log('done')
}

go().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
