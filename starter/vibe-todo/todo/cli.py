"""Command line entry point. One `cmd_<name>` function per subcommand."""

import argparse

from todo import store


def cmd_add(args: argparse.Namespace) -> int:
    tasks = store.load()
    next_id = max((t["id"] for t in tasks), default=0) + 1
    tasks.append({"id": next_id, "title": args.title, "done": False})
    store.save(tasks)
    print(f"Added #{next_id}: {args.title}")
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    tasks = store.load()
    if not tasks:
        print("No tasks yet.")
        return 0
    for t in tasks:
        mark = "x" if t["done"] else " "
        print(f"[{mark}] #{t['id']} {t['title']}")
    return 0


def cmd_done(args: argparse.Namespace) -> int:
    tasks = store.load()
    for t in tasks:
        if t["id"] == args.id:
            t["done"] = True
            store.save(tasks)
            print(f"Completed #{args.id}")
            return 0
    print(f"No task #{args.id}")
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="todo", description="A tiny todo list.")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="Add a task")
    p_add.add_argument("title")
    p_add.set_defaults(func=cmd_add)

    p_list = sub.add_parser("list", help="List tasks")
    p_list.set_defaults(func=cmd_list)

    p_done = sub.add_parser("done", help="Mark a task as done")
    p_done.add_argument("id", type=int)
    p_done.set_defaults(func=cmd_done)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)
