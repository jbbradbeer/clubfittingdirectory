import unittest

from discovery.normalize import norm_city, norm_name, norm_phone, site_domain


class TestNormalize(unittest.TestCase):
    def test_norm_name_strips_suffixes_and_punct(self):
        self.assertEqual(norm_name("True Spec Golf, LLC"), "true spec golf")
        self.assertEqual(norm_name("The Golf Lab Inc."), "golf lab")
        self.assertEqual(norm_name("Club Champion — Dallas"), "club champion dallas")

    def test_norm_phone(self):
        self.assertEqual(norm_phone("(512) 555-0134"), "5125550134")
        self.assertEqual(norm_phone("+1 512-555-0134"), "5125550134")
        self.assertEqual(norm_phone("555-0134"), "")     # too short
        self.assertEqual(norm_phone(""), "")

    def test_norm_city(self):
        self.assertEqual(norm_city("Ft. Worth"), "fort worth")
        self.assertEqual(norm_city("Saint Petersburg"), "st petersburg")

    def test_site_domain(self):
        self.assertEqual(site_domain("https://www.truespecgolf.com/tx"), "truespecgolf.com")
        self.assertEqual(site_domain("truespecgolf.com"), "truespecgolf.com")
        self.assertEqual(site_domain(""), "")
        self.assertEqual(site_domain("HTTPS://WWW.TrueSpecGolf.com/tx"), "truespecgolf.com")
        self.assertEqual(site_domain("Http://example.com"), "example.com")


if __name__ == "__main__":
    unittest.main()
