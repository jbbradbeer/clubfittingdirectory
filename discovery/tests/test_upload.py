import unittest

from discovery.upload_new_shops import make_slug, row_to_shop, valid_row


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
        self.assertEqual(shop["street"], "1 Main St")
        self.assertEqual(shop["postal_code"], "75023")
        self.assertNotIn("address", shop)
        self.assertNotIn("zip", shop)

    def test_row_to_shop_missing_columns(self):
        row = {"name": "Bomb Squad Golf", "city": "Plano",
               "state_code": "TX", "phone": "9725550101",
               "website": "bombsquadgolf.com", "sources": "titleist,openseo",
               "verdict": "new", "reason": "", "approved": "yes"}
        shop = row_to_shop(row, set())
        self.assertEqual(shop["street"], "")
        self.assertEqual(shop["postal_code"], "")

    def test_valid_row(self):
        good = {"name": "Bomb Squad Golf", "city": "Plano", "state_code": "TX"}
        self.assertEqual(valid_row(good), "")

        no_name = {"name": "", "city": "Plano", "state_code": "TX"}
        self.assertNotEqual(valid_row(no_name), "")

        no_city = {"name": "Bomb Squad Golf", "city": "", "state_code": "TX"}
        self.assertNotEqual(valid_row(no_city), "")

        bad_state = {"name": "Bomb Squad Golf", "city": "Plano", "state_code": "ZZ"}
        self.assertNotEqual(valid_row(bad_state), "")


if __name__ == "__main__":
    unittest.main()
