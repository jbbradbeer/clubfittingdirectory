import unittest

from discovery.upload_new_shops import make_slug, row_to_shop


class TestTransforms(unittest.TestCase):
    def test_make_slug_unique(self):
        taken = {"bomb-squad-golf-plano-tx"}
        self.assertEqual(make_slug("Bomb Squad Golf", "Plano", "TX", set()),
                         "bomb-squad-golf-plano-tx")
        self.assertEqual(make_slug("Bomb Squad Golf", "Plano", "TX", taken),
                         "bomb-squad-golf-plano-tx-2")

    def test_row_to_shop_defaults(self):
        row = {"name": "Bomb Squad Golf", "address": "1 Main St", "city": "Plano",
               "state_code": "TX", "zip": "75023", "phone": "9725550101",
               "website": "bombsquadgolf.com", "sources": "titleist,openseo",
               "verdict": "new", "reason": "", "approved": "yes"}
        shop = row_to_shop(row, set())
        self.assertEqual(shop["status"], "active")
        self.assertEqual(shop["shop_type"], "Clubfitter")
        self.assertTrue(shop["offers_fitting"])
        self.assertEqual(shop["state_code"], "TX")
        self.assertEqual(shop["website"], "https://bombsquadgolf.com")
        self.assertEqual(shop["slug"], "bomb-squad-golf-plano-tx")


if __name__ == "__main__":
    unittest.main()
