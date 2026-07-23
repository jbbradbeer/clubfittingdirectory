import tempfile
import unittest
from pathlib import Path

from discovery.common import load_env_file


class TestEnv(unittest.TestCase):
    def test_load_env_file(self):
        with tempfile.NamedTemporaryFile("w", suffix=".env", delete=False) as f:
            f.write("# comment\nFIRECRAWL_API_KEY=fc-abc123\nOTHER=x=y\n")
        env = load_env_file(Path(f.name))
        self.assertEqual(env["FIRECRAWL_API_KEY"], "fc-abc123")
        self.assertEqual(env["OTHER"], "x=y")


if __name__ == "__main__":
    unittest.main()
