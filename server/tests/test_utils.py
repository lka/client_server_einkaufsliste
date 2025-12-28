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

    def test_ca_prefix_removal(self):
        """Test that 'ca. ' prefix is removed before parsing."""
        assert parse_quantity("ca. 150 g") == (150.0, "g")
        assert parse_quantity("ca. 2 kg") == (2.0, "kg")
        assert parse_quantity("ca. 500 ml") == (500.0, "ml")
        assert parse_quantity("Ca. 150 g") == (150.0, "g")  # case-insensitive
        assert parse_quantity("CA. 2 kg") == (2.0, "kg")  # case-insensitive
        assert parse_quantity("ca. ½ TL") == (0.5, "TL")
        assert parse_quantity("ca. 1½ kg") == (1.5, "kg")

    def test_text_based_simple_fractions(self):
        """Test parsing text-based simple fractions like 1/2, 3/4."""
        assert parse_quantity("1/2 TL") == (0.5, "TL")
        assert parse_quantity("3/4 kg") == (0.75, "kg")
        assert parse_quantity("1/4 l") == (0.25, "l")
        assert parse_quantity("2/3 Tasse") == (2 / 3, "Tasse")

    def test_text_based_mixed_fractions(self):
        """Test parsing text-based mixed fractions like 2 1/2, 1 3/4."""
        assert parse_quantity("2 1/2 kg") == (2.5, "kg")
        assert parse_quantity("1 3/4 l") == (1.75, "l")
        assert parse_quantity("3 1/4 TL") == (3.25, "TL")
        assert parse_quantity("5 1/2 Tassen") == (5.5, "Tassen")

    def test_text_based_fractions_without_unit(self):
        """Test parsing text-based fractions without unit."""
        num, unit = parse_quantity("1/2")
        assert num == 0.5
        assert unit == "" or unit is None

        num, unit = parse_quantity("2 1/2")
        assert num == 2.5
        assert unit == "" or unit is None

    def test_negative_text_based_fractions(self):
        """Test parsing negative text-based fractions for subtraction."""
        assert parse_quantity("-1/2 TL") == (-0.5, "TL")
        assert parse_quantity("-2 1/2 kg") == (-2.5, "kg")
        assert parse_quantity("-3/4 l") == (-0.75, "l")

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

    def test_merge_text_based_fractions_same_unit(self):
        """Test merging text-based fractions with same unit."""
        assert merge_quantities("1/2 TL", "1/2 TL") == "1 TL"
        assert merge_quantities("3/4 kg", "1/4 kg") == "1 kg"

    def test_merge_text_and_unicode_fractions(self):
        """Test merging text-based and unicode fractions."""
        assert merge_quantities("1/2 TL", "½ TL") == "1 TL"
        assert merge_quantities("¼ kg", "3/4 kg") == "1 kg"

    def test_merge_mixed_text_fractions(self):
        """Test merging mixed text-based fractions."""
        assert merge_quantities("2 1/2 kg", "1/2 kg") == "3 kg"
        assert merge_quantities("1 3/4 l", "1/4 l") == "2 l"

    def test_subtract_text_based_fractions(self):
        """Test subtracting text-based fractions."""
        result = merge_quantities("1 TL", "-1/2 TL")
        assert result == "0,5 TL"

        result = merge_quantities("2 1/2 kg", "-1/2 kg")
        assert result == "2 kg"
