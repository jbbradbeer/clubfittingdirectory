import json
import tempfile
import unittest
from pathlib import Path

from discovery.validate_raw import validate


def _write(blob):
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(blob, f)
    f.close()
    return Path(f.name)


GOOD = {"state": "TX", "source": "openseo", "records": [
    {"name": "Bomb Squad Golf", "address": "1 Main St", "city": "Plano",
     "state_code": "TX", "zip": "75023", "phone": "9725550101",
     "website": "bombsquadgolf.com", "source": "openseo"}]}


class TestValidate(unittest.TestCase):
    def test_good_file_passes(self):
        self.assertEqual(validate(_write(GOOD)), [])

    def test_missing_field_reported(self):
        bad = json.loads(json.dumps(GOOD))
        del bad["records"][0]["phone"]
        problems = validate(_write(bad))
        self.assertTrue(any("phone" in p for p in problems))

    def test_null_value_reported(self):
        bad = json.loads(json.dumps(GOOD))
        bad["records"][0]["website"] = None
        self.assertTrue(any("website" in p for p in validate(_write(bad))))

    def test_state_mismatch_reported(self):
        bad = json.loads(json.dumps(GOOD))
        bad["records"][0]["state_code"] = "OK"
        self.assertTrue(any("state_code" in p for p in validate(_write(bad))))


if __name__ == "__main__":
    unittest.main()
