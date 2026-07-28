import json
import unittest
from unittest import mock

from discovery.sources import firecrawl_client as fc


def _resp(payload: dict):
    m = mock.MagicMock()
    m.read.return_value = json.dumps(payload).encode()
    m.__enter__ = lambda s: s
    m.__exit__ = lambda s, *a: False
    return m


class TestFirecrawl(unittest.TestCase):
    @mock.patch.object(fc, "firecrawl_key", return_value="fc-test")
    @mock.patch("urllib.request.urlopen")
    def test_scrape_returns_data(self, urlopen, _key):
        urlopen.return_value = _resp({"success": True, "data": {"markdown": "# hi"}})
        out = fc.scrape("https://example.com")
        self.assertEqual(out["markdown"], "# hi")
        req = urlopen.call_args[0][0]
        self.assertIn("/v2/scrape", req.full_url)
        self.assertEqual(req.get_header("Authorization"), "Bearer fc-test")

    @mock.patch.object(fc, "firecrawl_key", return_value="fc-test")
    @mock.patch("urllib.request.urlopen")
    def test_retries_once_then_raises(self, urlopen, _key):
        urlopen.side_effect = OSError("boom")
        with mock.patch.object(fc.time, "sleep"):
            with self.assertRaises(fc.FirecrawlError):
                fc.scrape("https://example.com")
        self.assertEqual(urlopen.call_count, 2)


if __name__ == "__main__":
    unittest.main()
