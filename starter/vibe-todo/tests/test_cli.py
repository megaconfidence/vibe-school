import contextlib
import io
import os
import tempfile
import unittest

from todo.cli import main


def run_cli(*argv: str) -> tuple[int, str]:
    """Run the CLI in-process and return (exit code, stdout)."""
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = main(list(argv))
    return code, out.getvalue()


class CliTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["TODO_FILE"] = os.path.join(self.tmp.name, "todo.json")

    def tearDown(self) -> None:
        os.environ.pop("TODO_FILE", None)
        self.tmp.cleanup()

    def test_add(self) -> None:
        code, out = run_cli("add", "Buy milk")
        self.assertEqual(code, 0)
        self.assertIn("Added #1: Buy milk", out)

    def test_list_empty(self) -> None:
        code, out = run_cli("list")
        self.assertEqual(code, 0)
        self.assertIn("No tasks yet.", out)

    def test_list_shows_tasks(self) -> None:
        run_cli("add", "Buy milk")
        code, out = run_cli("list")
        self.assertEqual(code, 0)
        self.assertIn("[ ] #1 Buy milk", out)

    def test_done(self) -> None:
        run_cli("add", "Buy milk")
        code, out = run_cli("done", "1")
        self.assertEqual(code, 0)
        _, out = run_cli("list")
        self.assertIn("[x] #1 Buy milk", out)

    def test_done_unknown_id(self) -> None:
        code, out = run_cli("done", "42")
        self.assertEqual(code, 1)
        self.assertIn("No task #42", out)


if __name__ == "__main__":
    unittest.main()
