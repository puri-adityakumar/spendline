"""Seeded fixture generator. Not a real bill.

Prices are short-context USD per 1M tokens from
https://developers.openai.com/api/docs/pricing
as read on 2026-10-10. Seed is 20260701 so the files can be regenerated.
"""

import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEED = 20260701
START = datetime(2026, 7, 1, tzinfo=timezone.utc)
END = datetime(2026, 9, 30, 23, 59, tzinfo=timezone.utc)
TEAMS = ("Support", "Backend", "Growth", "Data", "Ops")
# calls per weekday. Weekends use half, rounded down, minimum 1.
WEEKDAY_CALLS = {
    "Support": 40,
    "Backend": 25,
    "Growth": 15,
    "Data": 12,
    "Ops": 10,
}
# model, input $/1M, output $/1M, weight by team
RATES = {
    "gpt-6-luna": (0.10, 0.50),
    "gpt-5.6-luna": (0.20, 1.20),
    "gpt-5.6-terra": (2.00, 12.00),
    "gpt-6.1-sol": (2.00, 10.00),
    "gpt-5.6-sol": (4.00, 20.00),
    "gpt-6-astra": (10.00, 50.00),
}
MIX = {
    "Support": (("gpt-6-luna", 70), ("gpt-5.6-luna", 25), ("gpt-6.1-sol", 5)),
    "Backend": (("gpt-6.1-sol", 55), ("gpt-5.6-sol", 30), ("gpt-6-luna", 15)),
    "Growth": (("gpt-5.6-luna", 80), ("gpt-6-luna", 20)),
    "Data": (("gpt-5.6-terra", 70), ("gpt-5.6-sol", 20), ("gpt-6-luna", 10)),
    "Ops": (("gpt-6-luna", 50), ("gpt-5.6-luna", 30), ("gpt-6-astra", 15), ("gpt-6.1-sol", 5)),
}
SOURCE = "https://developers.openai.com/api/docs/pricing"
ROOT = Path(__file__).resolve().parent


def pick(rng, weighted):
    total = sum(weight for _, weight in weighted)
    draw = rng.randrange(total)
    for model, weight in weighted:
        draw -= weight
        if draw < 0:
            return model
    return weighted[-1][0]


def main():
    rng = random.Random(SEED)
    rows = []
    day = START
    while day.date() <= END.date():
        weekend = day.weekday() >= 5
        for team in TEAMS:
            calls = WEEKDAY_CALLS[team] // 2 if weekend else WEEKDAY_CALLS[team]
            calls = max(calls, 1)
            for _ in range(calls):
                model = pick(rng, MIX[team])
                prompt = rng.randint(180, 4200)
                completion = rng.randint(40, 900)
                start = day.replace(
                    hour=rng.randint(0, 23),
                    minute=rng.randint(0, 59),
                    second=rng.randint(0, 59),
                    microsecond=0,
                )
                duration_ms = rng.randint(400, 12000)
                end = start + timedelta(milliseconds=duration_ms)
                input_rate, output_rate = RATES[model]
                cost = (prompt / 1_000_000) * input_rate + (completion / 1_000_000) * output_rate
                rows.append(
                    {
                        "team": team,
                        "occurred_at": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "end_at": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "model": model,
                        "prompt_tokens": prompt,
                        "completion_tokens": completion,
                        "total_tokens": prompt + completion,
                        "cost_usd": round(cost, 6),
                        "duration_ms": duration_ms,
                    }
                )
        day += timedelta(days=1)

    rows.sort(key=lambda row: (row["occurred_at"], row["team"]))

    with (ROOT / "invoices.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "team",
                "occurred_at",
                "model",
                "prompt_tokens",
                "completion_tokens",
                "total_tokens",
                "cost_usd",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row[key] for key in writer.fieldnames})

    with (ROOT / "price-card.csv").open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["model", "input_usd_per_mtok", "output_usd_per_mtok"])
        for model, (inp, out) in RATES.items():
            writer.writerow([model, f"{inp:.2f}", f"{out:.2f}"])

    with (ROOT / "traces.jsonl").open("w") as handle:
        for index, row in enumerate(rows):
            slug = row["team"].lower()
            trace = {
                "name": "spendline-investigator",
                "project": "spendline",
                "start": row["occurred_at"],
                "end": row["end_at"],
                "metadata": {"team": row["team"], "fixture": True},
                "attributes": {"neatlogs.end_user.id": f"team-{slug}"},
                "children": [
                    {
                        "name": "completion",
                        "kind": "LLM",
                        "model": row["model"],
                        "input": "fixture",
                        "output": "fixture",
                        "tokens": {
                            "prompt": row["prompt_tokens"],
                            "completion": row["completion_tokens"],
                            "total": row["total_tokens"],
                        },
                        "start": row["occurred_at"],
                        "end": row["end_at"],
                        "duration_ms": row["duration_ms"],
                        "attributes": {"neatlogs.llm.provider": "openai"},
                    }
                ],
            }
            handle.write(json.dumps(trace, separators=(",", ":")) + "\n")

    by_team = {team: 0 for team in TEAMS}
    tokens = 0
    cost = 0.0
    for row in rows:
        by_team[row["team"]] += 1
        tokens += row["total_tokens"]
        cost += row["cost_usd"]
    summary = {
        "fixture": True,
        "seed": SEED,
        "from": rows[0]["occurred_at"],
        "to": rows[-1]["occurred_at"],
        "rows": len(rows),
        "teams": by_team,
        "total_tokens": tokens,
        "total_cost_usd": round(cost, 2),
        "models": list(RATES),
        "price_source": SOURCE,
        "neatlogs_doc": "https://docs.neatlogs.com/sdk/http-injection",
    }
    (ROOT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
