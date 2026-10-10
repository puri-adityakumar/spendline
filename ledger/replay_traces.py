"""Replay ledger/traces.jsonl to neatlogs. Sends nothing without a write key.

POST https://ingest.neatlogs.com/v1/trace
Authorization: Bearer $NEATLOGS_WRITE_KEY
Docs: https://docs.neatlogs.com/sdk/http-injection
"""

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENDPOINT = "https://ingest.neatlogs.com/v1/trace"
TRACES = Path(__file__).resolve().parent / "traces.jsonl"


def main():
    key = os.environ.get("NEATLOGS_WRITE_KEY", "").strip()
    if not key:
        print("NEATLOGS_WRITE_KEY is unset. No traces were sent.")
        return 0
    sent = 0
    with TRACES.open() as handle:
        for line in handle:
            body = line.strip().encode()
            request = urllib.request.Request(
                ENDPOINT,
                data=body,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    response.read()
            except urllib.error.HTTPError as error:
                detail = error.read().decode("utf-8", errors="replace")
                print(f"POST failed at row {sent + 1}: {error.code} {detail}", file=sys.stderr)
                return 1
            sent += 1
    print(f"Sent {sent} traces.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
