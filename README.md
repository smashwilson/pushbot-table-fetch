# Pushbot table fetch

Quick node.js script to fetch a [DocumentSet]() from [pushbot's]() production database and populate a local development one. Useful for doing tests against Real Data.

## Setup

```sh
npm install
cp secrets.example.sh secrets.sh
${EDITOR} secrets.sh
```

## Running

Also see `npm start -- --help`.

```sh
# If you have secrets.sh populated:
source secrets.sh
npm start -- --ds quotes

# If you don't:
npm start -- \
  --from postgres://user:password@host/dbname \
  --to postgres://me:shhh@localhost/pushbottest \
  --ds quotes
```
