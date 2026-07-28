import unittest

from discovery.dedupe import ExistingIndex, classify, merge_candidates

SHOPS = [
    {"id": "1", "name": "True Spec Golf", "phone": "(512) 555-0134",
     "city": "Austin", "state_code": "TX", "website": "https://truespecgolf.com", "status": "active"},
    {"id": "2", "name": "Golf Etc of Dallas", "phone": "",
     "city": "Dallas", "state_code": "TX", "website": "golfetcdallas.com", "status": "inactive"},
]


def idx():
    return ExistingIndex.build(SHOPS)


class TestClassify(unittest.TestCase):
    def test_same_phone_is_duplicate(self):
        cand = {"name": "Totally Different Name", "phone": "512-555-0134",
                "city": "Round Rock", "state_code": "TX", "website": ""}
        verdict, reason = classify(cand, idx())
        self.assertEqual(verdict, "duplicate")
        self.assertIn("phone", reason)

    def test_inactive_shop_still_blocks(self):
        cand = {"name": "Golf Etc of Dallas", "phone": "",
                "city": "Dallas", "state_code": "TX", "website": ""}
        self.assertEqual(classify(cand, idx())[0], "duplicate")

    def test_same_domain_is_duplicate(self):
        cand = {"name": "TS Golf Studio", "phone": "",
                "city": "Austin", "state_code": "TX",
                "website": "https://www.truespecgolf.com/book"}
        verdict, reason = classify(cand, idx())
        self.assertEqual(verdict, "duplicate")
        self.assertIn("domain", reason)

    def test_fuzzy_name_same_city_is_uncertain(self):
        cand = {"name": "True Spec Golf Austin", "phone": "",
                "city": "Austin", "state_code": "TX", "website": ""}
        self.assertEqual(classify(cand, idx())[0], "uncertain")

    def test_unrelated_is_new(self):
        cand = {"name": "Bomb Squad Golf", "phone": "9725550101",
                "city": "Plano", "state_code": "TX", "website": "bombsquadgolf.com"}
        self.assertEqual(classify(cand, idx())[0], "new")


class TestMerge(unittest.TestCase):
    def test_same_shop_from_two_sources_merges(self):
        a = {"name": "Bomb Squad Golf", "phone": "9725550101", "city": "Plano",
             "state_code": "TX", "website": "", "address": "", "zip": "", "source": "titleist"}
        b = {"name": "Bomb Squad Golf LLC", "phone": "9725550101", "city": "Plano",
             "state_code": "TX", "website": "bombsquadgolf.com", "address": "", "zip": "", "source": "openseo"}
        merged = merge_candidates([a, b])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["sources"], "openseo,titleist")
        self.assertEqual(merged[0]["website"], "bombsquadgolf.com")  # richer field wins


if __name__ == "__main__":
    unittest.main()
