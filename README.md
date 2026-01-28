# Slack Exporter

A simple utility to export Slack channel history to Markdown files. This tool fetches messages between two dates and outputs them in a formatted list, including user real names.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed on your machine.
- **Slack App**: You need a Slack Bot token (`xoxb-...`) with the following permissions:
  - `channels:history`
  - `groups:history` (if exporting private channels)
  - `users:read` (to fetch real names)
  - `channels:read` (to access public channels)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and paste your `SLACK_BOT_TOKEN`.

## Usage

Run the exporter using `ts-node`:

```bash
npx ts-node export_channel.ts <CHANNEL_ID> <START_DATE> <END_DATE> [OUTPUT_FILE]
```

### Arguments

- `<CHANNEL_ID>`: The ID of the Slack channel (e.g., `C0123ABCDEF`). You can find this in the channel's "About" or "Settings" section in Slack.
- `<START_DATE>`: The start date in `YYYY-MM-DD` format.
- `<END_DATE>`: The end date in `YYYY-MM-DD` format (inclusive).
- `[OUTPUT_FILE]` (Optional): The path to the output Markdown file. If omitted, a default filename will be generated.

### Example

```bash
npx ts-node export_channel.ts C0123456789 2025-01-01 2025-01-31 export.md
```

## Features

- **Markdown Output**: Generates a clean Markdown list of messages.
- **Real Name Resolution**: Automatically converts Slack user IDs into their real names.
- **Date Filtering**: Allows precise export of messages between two dates.
