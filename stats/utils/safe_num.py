class SafeNum:
    """Implements a number that has a contagious None. Many columns are missing data. If data from a column is missing, we can't do a calculation accurately. This allows a number to turn into None without freaking out. But any further calculations with None always return None. Also dividing by 0 turns into None. Otherwise, this should behave like a normal number"""

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

        return SafeNum(self.x + other)

    def __iadd__(self, other):
        """+="""
        if other is None:
            return None

        self.x = self.x + other
        return self

    def __radd__(self, other):
        """right side of +"""
        return self.__add__(other)

    def __sub__(self, other):
        """-"""
        if self.x is None or other is None:
            return None

        return self.__add__(-other)

    def __isub__(self, other):
        """-="""
        if other is None:
            return None

        self.x = self.x - other
        return self

    def __rsub__(self, other):
        """right side of -"""
        if other is None:
            return None

        return other - self.x

    def __mul__(self, other):
        """*"""
        if self.x is None or other is None:
            return None

        return SafeNum(self.x * other)

    def __imul__(self, other):
        """*="""
        if other is None:
            return None

        self.x = self.x * other
        return self

    def __rmul__(self, other):
        """right side of *"""
        return self.__mul__(other)

    def __floordiv__(self, other):
        """// returns an int"""
        if other == 0 or other is None:
            return None

        return SafeNum(self.x * (1 // other))

    def __rfloordiv__(self, other):
        """// returns an int"""
        return self.__floordiv__(other)

    def __truediv__(self, other):
        """/ returns a float"""
        if other == 0 or other is None:
            return None

        return SafeNum(self.x * (1 / other))

    def __rtruediv__(self, other):
        """/ returns a float"""
        return self.__truediv__(other)
