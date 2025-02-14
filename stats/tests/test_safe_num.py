import unittest

from stats.utils import SafeNum


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

        self.assertEqual(x, 3, "+= between SafeNums")

        x = SafeNum(1)
        y = 2

        x += y

        self.assertEqual(x, 3, "+= between an int and SafeNum")

        x = SafeNum(1)
        y = 2

        y += x

        self.assertEqual(y, 3, "+= between a SafeNum and an int")

    def test_subtracting(self):
        x = SafeNum(1)
        y = SafeNum(2)

        self.assertEqual(x - y, -1, "Two SafeNums")

        x = 1
        y = SafeNum(2)

        self.assertEqual(x - y, -1, "A SafeNum and an int")

        x = 1.0
        y = SafeNum(2)

        self.assertEqual(x - y, -1.0, "A SafeNum and a float")

        x = SafeNum(1)
        y = SafeNum(2)

        x -= y

        self.assertEqual(x, -1, "-= between SafeNums")

        x = SafeNum(1)
        y = 2

        x -= y

        self.assertEqual(x, -1, "-= between an int and SafeNum")

        x = SafeNum(1)
        y = 2

        y -= x

        self.assertEqual(y, 1, "-= between a SafeNum and an int")

        # TODO more of these, including JSON serialization

    def test_multiplying(self):
        x = SafeNum(3)
        y = SafeNum(2)

        self.assertEqual(x * y, 6, "Two SafeNums")

        x = 1
        y = SafeNum(2)

        self.assertEqual(x * y, 2, "A SafeNum and an int")

        x = 1.0
        y = SafeNum(2)

        self.assertEqual(x * y, 2.0, "A SafeNum and a float")

        x = SafeNum(3)
        y = SafeNum(2)

        x *= y

        self.assertEqual(x, 6, "*= between SafeNums")

        x = SafeNum(3)
        y = 2

        x *= y

        self.assertEqual(x, 6, "*= between an int and SafeNum")

        x = SafeNum(3)
        y = 2

        y *= x

        self.assertEqual(y, 6, "*= between a SafeNum and an int")

    def test_nones(self):
        x = SafeNum(3)

        self.assertIsNone(x + None, "SafeNum + None = None")
        self.assertIsNone(x - None, "SafeNum - None = None")
        self.assertIsNone(x * None, "SafeNum * None = None")
        self.assertIsNone(x / None, "SafeNum / None = None")
        self.assertIsNone(None + x, "None + SafeNum = None")
        self.assertIsNone(None - x, "None - SafeNum = None")
        self.assertIsNone(None * x, "None * SafeNum = None")
        self.assertIsNone(None / x, "None / SafeNum = None")

        a = SafeNum(3)
        a += None

        self.assertIsNone(a, "SafeNum += None")

        a = SafeNum(3)
        a -= None

        self.assertIsNone(a, "SafeNum -= None")

        a = SafeNum(3)
        a *= None

        self.assertIsNone(a, "SafeNum *= None")
