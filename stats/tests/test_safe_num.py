import json
import math
import unittest

from stats.utils import SafeEncoder, SafeNum


class TestSafeNumOperations(unittest.TestCase):
    def test_adding(self):
        x = SafeNum(1)
        y = SafeNum(2)

        self.assertEqual(x + y, 3, "Two SafeNums")

        x = 1
        y = SafeNum(2)

        self.assertEqual(x + y, 3, "A SafeNum and an int")
        self.assertIsInstance(x + y, SafeNum, "int + SafeNum = SafeNum")

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
        self.assertIsInstance(x, SafeNum, "+= between an int and SafeNum is a SafeNum")

        x = SafeNum(1)
        y = 2

        y += x

        self.assertEqual(y, 3, "+= between a SafeNum and an int")

        x = SafeNum(1)
        y = 2

        self.assertIsInstance(x + y, SafeNum, "SafeNum + int = SafeNum")

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

    def test_dividing_float(self):
        x = SafeNum(3)
        y = SafeNum(2)

        self.assertEqual(x / y, 1.5, "Two SafeNums")

        x = 1
        y = SafeNum(2)

        self.assertEqual(x / y, 0.5, "A SafeNum and an int")

        x = 1.0
        y = SafeNum(2)

        self.assertEqual(x / y, 0.5, "A SafeNum and a float")

        x = SafeNum(3)
        y = SafeNum(2)

        x /= y

        self.assertEqual(x, 1.5, "/= between SafeNums")

        x = SafeNum(3)
        y = 2

        x /= y

        self.assertEqual(x, 1.5, "/= between an int and SafeNum")

        x = SafeNum(4)
        y = 2

        y /= x

        self.assertEqual(y, 0.5, "/= between a SafeNum and an int")

        x = SafeNum(4)
        y = 0

        self.assertEqual(x / y, None, "x / 0 = None")

    def test_dividing_int(self):
        x = SafeNum(3)
        y = SafeNum(2)

        self.assertEqual(x // y, 1, "Two SafeNums")

        x = 5
        y = SafeNum(2)

        self.assertEqual(x // y, 2, "A SafeNum and an int")

        x = 11.0
        y = SafeNum(2)

        self.assertEqual(x // y, 5, "A SafeNum and a float")

        x = SafeNum(3)
        y = SafeNum(2)

        x //= y

        self.assertEqual(x, 1, "//= between SafeNums")

        x = SafeNum(3)
        y = 2

        x //= y

        self.assertEqual(x, 1, "//= between an int and SafeNum")

        x = SafeNum(4)
        y = 2

        y //= x

        self.assertEqual(y, 0, "//= between a SafeNum and an int")

        x = SafeNum(4)
        y = 0

        self.assertEqual(x // y, None, "x / 0 = None")

    def test_nones(self):
        x = SafeNum(3)

        self.assertEqual(x + None, None, "SafeNum + None = None")
        self.assertEqual(x - None, None, "SafeNum - None = None")
        self.assertEqual(x * None, None, "SafeNum * None = None")
        self.assertEqual(x / None, None, "SafeNum / None = None")
        self.assertEqual(None + x, None, "None + SafeNum = None")
        self.assertEqual(None - x, None, "None - SafeNum = None")
        self.assertEqual(None * x, None, "None * SafeNum = None")
        self.assertEqual(None / x, None, "None / SafeNum = None")

        a = SafeNum(3)
        a += None

        self.assertEqual(a, None, "SafeNum += None")

        a = SafeNum(3)
        a -= None

        self.assertEqual(a, None, "SafeNum -= None")

        a = SafeNum(3)
        a *= None

        self.assertEqual(a, None, "SafeNum *= None")

        a = SafeNum(3)
        a /= None

        self.assertEqual(a, None, "SafeNum /= None")

    def test_series_of_operations(self):
        a = SafeNum(3)
        b = SafeNum(4)
        c = SafeNum(5)

        x = math.sqrt(a**2 + b**2 + c**2)

        self.assertEqual(x, math.sqrt(50), "3d euclidean distance")

        x = a + b / 10

        self.assertEqual(x, 3.4, "add and divide")

        d = SafeNum(0)

        y = (a + b + c / d) / 4

        self.assertEqual(y, None, "dividing by 0 is None and it turns everything None")

        y = (a + 4 + c / None) / 5

        self.assertEqual(y, None, "dividing by None is None")

    def test_json_dump(self):
        a = SafeNum(4)

        dumped = json.dumps({"d": a}, cls=SafeEncoder)

        self.assertEqual(dumped, '{"d": 4}', "int JSON stringified")

        a = SafeNum(4.0)

        dumped = json.dumps({"d": a}, cls=SafeEncoder)

        self.assertEqual(dumped, '{"d": 4.0}', "float JSON stringified")

        dumped_with_none = json.dumps({"d": SafeNum(None)}, cls=SafeEncoder)

        self.assertEqual(dumped_with_none, '{"d": null}', "None JSON stringified")

    def test_is_none(self):
        a = SafeNum(0)

        self.assertFalse(a.is_none, "0 is not None")

        b = SafeNum(None)

        self.assertTrue(b.is_none, "None is None")

        self.assertIsNotNone(b, "SafeNum cannot be used with `is None' syntax")
