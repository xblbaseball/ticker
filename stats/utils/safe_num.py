from json import JSONEncoder
import numbers


class SafeNum(numbers.Number):
    """
    Implements a number that has a contagious None. Many columns are missing data. If data from a column is missing, we can't do a calculation accurately. This allows a number to turn into None without freaking out. But any further calculations with None always return SafeNum(None. Also dividing by 0 turns into None. Otherwise, this should behave like a normal )number

    The reason we use None instead of something like NaN or Infinity is because None is JSON serializable, while other non-numeric values are not.

    FYI, this class is not compatible with `is None' syntax
    """

    def __init__(self, x: float | int | str | None):
        if x is None:
            self._x = None
        elif isinstance(x, str):
            try:
                y = float(x)
                self._x = y
            except ValueError as e:
                self._x = None
        else:
            self._x = x

    def __int__(self):
        if self._x is None:
            return int("nan")

        return int(self._x)

    def __float__(self):
        if self._x is None:
            return float("nan")

        return float(self._x)

    def __repr__(self):
        """string representation"""
        return str(self._x)

    def __eq__(self, other):
        """=="""
        if isinstance(other, SafeNum):
            return self._x == other._x

        return self._x == other

    def __ne__(self, other):
        """!="""
        return not self._x == other

    def __neg__(self):
        """negative"""
        if self._x is None:
            return self

        return self.__mul__(-1)

    def __add__(self, other):
        """+"""
        if self._x is None or other is None:
            return SafeNum(None)

        return SafeNum(self._x + other)

    def __iadd__(self, other):
        """+="""
        if other is None:
            return SafeNum(None)

        self._x = self._x + other
        return self

    def __radd__(self, other):
        """right side of +"""
        return self.__add__(other)

    def __sub__(self, other):
        """-"""
        if self._x is None or other is None:
            return SafeNum(None)

        return self.__add__(-other)

    def __isub__(self, other):
        """-="""
        if other is None:
            return SafeNum(None)

        self._x = self._x - other
        return self

    def __rsub__(self, other):
        """right side of -"""
        if other is None:
            return SafeNum(None)

        return other - self._x

    def __mul__(self, other):
        """*"""
        if self._x is None or other is None:
            return SafeNum(None)

        return SafeNum(self._x * other)

    def __imul__(self, other):
        """*="""
        if other is None:
            return SafeNum(None)

        self._x = self._x * other
        return self

    def __rmul__(self, other):
        """right side of *"""
        return self.__mul__(other)

    def __floordiv__(self, other):
        """// returns an int"""
        if other == 0 or other is None:
            return SafeNum(None)

        return SafeNum(self._x // other)

    def __ifloordiv__(self, other):
        """//= returns an int"""
        if other is None:
            return SafeNum(None)

        self._x = self._x // other
        return self

    def __rfloordiv__(self, other):
        """// returns an int"""
        if self is None or other is None or self._x == 0:
            return SafeNum(None)

        return SafeNum(other // self._x)

    def __truediv__(self, other):
        """/ returns a float"""
        if self._x is None or other is None or other == 0:
            return SafeNum(None)

        return SafeNum(self._x / other)

    def __itruediv__(self, other):
        """/= returns a float"""
        if self._x is None or other is None:
            return SafeNum(None)

        self._x = self._x / other
        return self

    def __rtruediv__(self, other):
        """/ returns a float"""
        if self._x is None or other is None or self._x == 0:
            return SafeNum(None)

        return SafeNum(other / self._x)

    def __pow__(self, other):
        """**"""
        if other is None:
            return SafeNum(None)

        return SafeNum(self._x**other)

    def __ipow__(self, other):
        """**="""
        if other is None:
            return SafeNum(None)

        self._x = self._x**other
        return self

    def __round__(self, *args, **kwargs):
        """round"""
        if self._x is None:
            return self

        self._x = round(self._x, *args, **kwargs)
        return self

    @property
    def is_none(self):
        """is the value held None"""
        return self._x is None


class SafeEncoder(JSONEncoder):
    """JSON encoder that can handle SafeNum, otherwise it's normal"""

    def __init__(
        self,
        *,
        skipkeys=False,
        ensure_ascii=True,
        check_circular=True,
        allow_nan=True,
        sort_keys=False,
        indent=None,
        separators=None,
        default=None
    ):
        super().__init__(
            skipkeys=skipkeys,
            ensure_ascii=ensure_ascii,
            check_circular=check_circular,
            allow_nan=allow_nan,
            sort_keys=sort_keys,
            indent=indent,
            separators=separators,
            default=default,
        )

    def default(self, obj):
        if isinstance(obj, SafeNum):
            return obj._x
        return super().default(obj)
