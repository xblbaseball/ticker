class SafeNum:
    """Many columns are missing data. This doesn't freak out when a number turns to None. Also dividing by 0 turns into None"""

    def __init__(self, x: float | int | str | None):
        if x is None:
            self.x = None
        elif isinstance(x, str):
            try:
                y = float(x)
                self.x = y
            except ValueError as e:
                self.x = None
        else:
            self.x = x

    def __repr__(self):
        """string representation"""
        return str(self.x)

    def __eq__(self, other):
        """=="""
        if isinstance(other, SafeNum):
            return self.x == other.x

        if self.x is None or other is None:
            return False

        return self.x == other

    def __ne__(self, other):
        """!="""
        return not self.x == other

    def __neg__(self):
        """negative"""
        return -1 * self.x

    def __add__(self, other):
        """+"""
        if self.x is None or other is None:
            return None

        return self.x + other

    def __iadd__(self, other):
        """+="""
        self.x = self.x + other
        return self

    def __radd__(self, other):
        """right side of +"""
        return self.__add__(other)

    def __sub__(self, other):
        """-"""
        return self.__add__(-other)

    def __isub__(self, other):
        """-="""
        self.x = self.x - other
        return self

    def __rsub__(self, other):
        """right side of -"""
        return other - self.x

    def __mul__(self, other):
        """*"""
        if self.x is None or other is None:
            return None

        return self.x * other

    def __rmul__(self, other):
        """right side of *"""
        return self.__mul__(other)

    def __floordiv__(self, other):
        """// returns an int"""
        if other == 0:
            return None

        return self.x * (1 // other)

    def __rfloordiv__(self, other):
        """// returns an int"""
        return self.__floordiv__(other)

    def __truediv__(self, other):
        """/ returns a float"""
        if other == 0:
            return None

        return self.x * (1 / other)

    def __rtruediv__(self, other):
        """/ returns a float"""
        return self.__truediv__(other)
