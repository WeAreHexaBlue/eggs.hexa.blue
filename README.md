# eggs.hexa.blue

Server Eggs's official website and server dashboard.

The dashboard talks to the same PostgreSQL database as the
[Server Eggs bot](https://github.com/HexaBlue/ServerEggs), so guild settings
edited here take effect in the bot immediately and vice versa.

## Requirements

- [Bun](https://bun.sh)
- A PostgreSQL database shared with the bot
- A Discord application with the `identify` and `guilds` OAuth scopes, plus a
  bot token for the bot itself

## Setup

```sh
bun install
cp .env.example .env
# Fill in DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET, and the Discord credentials.
bun run db:push   # create the auth schema; bot tables must already exist
bun run dev
```

## Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `bun run dev`     | Start the development server                 |
| `bun run build`   | Build the production server                  |
| `bun run preview` | Preview the production build                 |
| `bun run check`   | Run `svelte-check`                           |
| `bun run lint`    | Check formatting with Prettier and ESLint    |
| `bun run format`  | Format the project                           |
| `bun run test`    | Run the Playwright end-to-end tests          |
| `bun run db:push` | Push the Drizzle auth schema to the database |

## Dashboard

Signing in with Discord lists the servers you can manage. For servers that
already have the bot, you can edit:

- language and external-language settings
- the join-origin-server button
- public listing, server description, and the generated invite
- allowed content ratings per channel type
- per-channel default ratings
- the log channel
- battle duration
