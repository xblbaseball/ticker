from models.safe_num import SafeNum
import unittest


class TestSafeNumOperations(unittest.TestCase):
    def test_adding(self):
        x = SafeNum(1)
        y = SafeNum(2)

        self.assertEqual(x + y, 3, "Two SafeNums")

        x = 1
        y = SafeNum(2)

        self.assertEqual(x + y, 3, "A SafeNum and an int")

        x = 1.0
        y = SafeNum(2)

        self.assertEqual(x + y, 3.0, "A SafeNum and a float")

        x = SafeNum(1)
        y = SafeNum(2)

        x += y

        self.assertEqual(x, 3, "+=")

        # TODO more of these, including JSON serialization
