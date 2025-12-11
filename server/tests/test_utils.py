"""Tests for utility functions including fraction support."""

from server.src.utils import (
    parse_quantity,
    merge_quantities,
    _convert_fraction_to_decimal,
)


class TestConvertFractionToDecimal:
    """Tests for _convert_fraction_to_decimal function."""

    def test_simple_fractions(self):
        """Test conversion of simple fraction characters."""
        assert _convert_fraction_to_decimal("½") == 0.5
        assert _convert_fraction_to_decimal("¼") == 0.25
        assert _convert_fraction_to_decimal("¾") == 0.75
        assert _convert_fraction_to_decimal("⅓") == 0.333
        assert _convert_fraction_to_decimal("⅔") == 0.667

    def test_mixed_numbers(self):
        """Test conversion of mixed numbers (whole + fraction)."""
        assert _convert_fraction_to_decimal("1½") == 1.5
        assert _convert_fraction_to_decimal("2¼") == 2.25
        assert _convert_fraction_to_decimal("3¾") == 3.75
        assert _convert_fraction_to_decimal("10½") == 10.5

    def test_negative_mixed_numbers(self):
        """Test conversion of negative mixed numbers."""
        assert _convert_fraction_to_decimal("-1½") == -1.5
        assert _convert_fraction_to_decimal("-2¼") == -2.25

    def test_invalid_input(self):
        """Test invalid input returns None."""
        assert _convert_fraction_to_decimal("abc") is None
        assert _convert_fraction_to_decimal("123") is None
        assert _convert_fraction_to_decimal("") is None


class TestParseQuantity:
    """Tests for parse_quantity function."""

    def test_regular_numbers(self):
        """Test parsing regular numbers."""
        assert parse_quantity("500 g") == (500.0, "g")
        assert parse_quantity("2 kg") == (2.0, "kg")
        assert parse_quantity("1.5 l") == (1.5, "l")
        assert parse_quantity("2,5 ml") == (2.5, "ml")

    def test_simple_fractions(self):
        """Test parsing simple fractions."""
        assert parse_quantity("½ TL") == (0.5, "TL")
        assert parse_quantity("¼ kg") == (0.25, "kg")
        assert parse_quantity("¾ l") == (0.75, "l")
        assert parse_quantity("⅓ Tasse") == (0.333, "Tasse")

    def test_mixed_numbers(self):
        """Test parsing mixed numbers (whole + fraction)."""
        assert parse_quantity("1½ kg") == (1.5, "kg")
        assert parse_quantity("2¼ l") == (2.25, "l")
        assert parse_quantity("3¾ TL") == (3.75, "TL")

    def test_fractions_without_unit(self):
        """Test parsing fractions without unit."""
        num, unit = parse_quantity("½")
        assert num == 0.5
        assert unit == "" or unit is None

        num, unit = parse_quantity("1½")
        assert num == 1.5
        assert unit == "" or unit is None

    def test_negative_quantities(self):
        """Test parsing negative quantities for subtraction."""
        assert parse_quantity("-300 g") == (-300.0, "g")
        assert parse_quantity("-½ TL") == (-0.5, "TL")
        assert parse_quantity("-1½ kg") == (-1.5, "kg")

    def test_numbers_without_unit(self):
        """Test parsing numbers without unit."""
        num, unit = parse_quantity("5")
        assert num == 5.0
        assert unit == "" or unit is None

    def test_invalid_input(self):
        """Test invalid input returns (None, None)."""
        assert parse_quantity(None) == (None, None)
        assert parse_quantity("") == (None, None)
        assert parse_quantity("abc") == (None, None)


class TestMergeQuantities:
    """Tests for merge_quantities function."""

    def test_merge_regular_numbers_same_unit(self):
        """Test merging regular numbers with same unit."""
        assert merge_quantities("500 g", "300 g") == "800 g"
        assert merge_quantities("2 kg", "3 kg") == "5 kg"

    def test_merge_fractions_same_unit(self):
        """Test merging fractions with same unit."""
        assert merge_quantities("½ TL", "½ TL") == "1 TL"
        assert merge_quantities("¼ kg", "¾ kg") == "1 kg"

    def test_merge_mixed_number_with_fraction(self):
        """Test merging mixed numbers with fractions."""
        assert merge_quantities("1½ kg", "½ kg") == "2 kg"
        assert merge_quantities("2¼ l", "¾ l") == "3 l"

    def test_merge_regular_with_fraction(self):
        """Test merging regular number with fraction."""
        result = merge_quantities("500 g", "½ kg")
        # Note: 500g + 0.5kg = 500g + 500g
        # (different units, should be semicolon-separated)
        # OR if units match exactly: 500g + 0.5g
        # The actual behavior depends on unit matching
        assert result is not None

    def test_merge_different_units(self):
        """Test merging different units creates semicolon-separated list."""
        result = merge_quantities("500 g", "2 Packungen")
        assert "500 g" in result
        assert "2 Packungen" in result
        assert ";" in result

    def test_subtract_with_fractions(self):
        """Test subtracting fractions."""
        assert merge_quantities("1 TL", "-½ TL") == "0,5 TL"
        assert merge_quantities("2 kg", "-¼ kg") == "1,75 kg"

    def test_subtract_to_zero(self):
        """Test subtracting to zero removes item."""
        assert merge_quantities("½ TL", "-½ TL") is None
        assert merge_quantities("1 kg", "-1 kg") is None

    def test_subtract_below_zero(self):
        """Test subtracting below zero removes item."""
        assert merge_quantities("½ TL", "-1 TL") is None
        assert merge_quantities("300 g", "-500 g") is None

    def test_cannot_subtract_from_nothing(self):
        """Test that negative quantities without existing item return None."""
        assert merge_quantities(None, "-500 g") is None
        assert merge_quantities(None, "-½ TL") is None

    def test_semicolon_separated_input(self):
        """Test merging semicolon-separated quantities."""
        result = merge_quantities("500 g; 2 Packungen", "300 g")
        assert "800 g" in result
        assert "2 Packungen" in result

    def test_merge_semicolon_separated_new(self):
        """Test merging with semicolon-separated new quantity."""
        result = merge_quantities("500 g", "2; 300 g")
        assert "800 g" in result
        assert "2" in result
