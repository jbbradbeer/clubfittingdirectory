import json
import unittest
from pathlib import Path

from discovery.sources.oem_locators import parse_ping

FIXTURES = Path(__file__).parent / "fixtures"


class TestPingParse(unittest.TestCase):
    def test_fixture_parses_to_raw_schema(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        self.assertGreater(len(recs), 0)
        for r in recs:
            self.assertEqual(
                set(r), {"name", "address", "city", "state_code", "zip",
                         "phone", "website", "source"})
            self.assertEqual(r["source"], "ping")
            self.assertEqual(r["state_code"], "TX")
            self.assertIsInstance(r["name"], str)
            self.assertNotEqual(r["name"], "")

    def test_filters_out_other_states(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        names = [r["name"] for r in recs]
        self.assertNotIn("DICK'S SPORTING GOODS-LAWTON", names)
        # 5 TX fixture records, 1 OK record filtered out
        self.assertEqual(len(recs), 5)

    def test_null_phone_becomes_empty_string(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        for r in recs:
            self.assertIsInstance(r["phone"], str)


if __name__ == "__main__":
    unittest.main()
