"""The only module that touches the disk. Tasks live in a JSON file."""

import json
import os
from pathlib import Path
from typing import TypedDict


class Task(TypedDict):
    id: int
    title: str
    done: bool


def path() -> Path:
    """Where tasks are stored. Override with TODO_FILE (the tests do)."""
    return Path(os.environ.get("TODO_FILE", ".todo.json"))


def load() -> list[Task]:
    file = path()
    if not file.exists():
        return []
    return json.loads(file.read_text())


def save(tasks: list[Task]) -> None:
    path().write_text(json.dumps(tasks, indent=2))
