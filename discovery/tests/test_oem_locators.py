import json
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

from discovery.sources.oem_locators import _http_json, parse_ping

FIXTURES = Path(__file__).parent / "fixtures"


class FakeResponse:
    """Minimal context-manager stand-in for urllib's HTTPResponse."""

    def __init__(self, body: bytes):
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


class TestHttpJsonRetry(unittest.TestCase):
    """No real network calls — urlopen is mocked throughout."""

    @patch("discovery.sources.oem_locators.urllib.request.urlopen")
    @patch("discovery.sources.oem_locators.time.sleep")
    def test_retries_once_after_transient_failure_then_succeeds(self, mock_sleep, mock_urlopen):
        mock_urlopen.side_effect = [
            urllib.error.URLError("connection reset"),
            FakeResponse(b'{"ok": true}'),
        ]
        result = _http_json("https://example.test/api", headers={})
        self.assertEqual(result, {"ok": True})
        self.assertEqual(mock_urlopen.call_count, 2)
        mock_sleep.assert_called_once_with(3)

    @patch("discovery.sources.oem_locators.urllib.request.urlopen")
    @patch("discovery.sources.oem_locators.time.sleep")
    def test_raises_after_second_failure(self, mock_sleep, mock_urlopen):
        mock_urlopen.side_effect = [
            urllib.error.URLError("connection reset"),
            TimeoutError("timed out"),
        ]
        with self.assertRaises(TimeoutError):
            _http_json("https://example.test/api", headers={})
        self.assertEqual(mock_urlopen.call_count, 2)


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

    def test_null_phone_becomes_empty_string(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        for r in recs:
            self.assertIsInstance(r["phone"], str)

    def test_excludes_records_with_no_fitting_badges(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        names = [r["name"] for r in recs]
        # all-false-badge TX records must be dropped
        self.assertNotIn("Abilene Country Club", names)
        self.assertNotIn("San Angelo Country Club", names)
        self.assertNotIn("Brownwood Country Club", names)

    def test_keeps_records_with_at_least_one_fitting_badge(self):
        payload = json.loads((FIXTURES / "ping_sample.json").read_text())
        recs = parse_ping(payload, "TX")
        names = [r["name"] for r in recs]
        # WEST TEXAS DISCOUNT GOLF: badgeFitterOfTheYear + badgeCertifiedFitter
        self.assertIn("WEST TEXAS DISCOUNT GOLF", names)
        # SAN ANGELO COUNTRY CLUB: badgeCertifiedFitter only
        self.assertIn("SAN ANGELO COUNTRY CLUB", names)
        # exactly these 2 TX fixture records carry a truthy badge
        self.assertEqual(len(recs), 2)


if __name__ == "__main__":
    unittest.main()
