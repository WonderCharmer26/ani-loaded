"""Unit tests for utilities/fileFunctions.py."""

from utilities.fileFunctions import ext_from_filename


def test_jpg_extension():
    assert ext_from_filename("photo.jpg") == ".jpg"


def test_png_extension():
    assert ext_from_filename("image.png") == ".png"


def test_webp_extension():
    assert ext_from_filename("banner.webp") == ".webp"


def test_uppercase_is_lowercased():
    assert ext_from_filename("image.PNG") == ".png"
    assert ext_from_filename("photo.JPEG") == ".jpeg"


def test_no_extension_returns_empty_string():
    assert ext_from_filename("filename") == ""


def test_empty_string_returns_empty_string():
    assert ext_from_filename("") == ""


def test_multiple_dots_uses_everything_after_first_dot():
    # split(".", 1) gives ["my", "backup.tar.gz"] so result is ".backup.tar.gz"
    assert ext_from_filename("my.backup.tar.gz") == ".backup.tar.gz"


def test_dot_prefix_file():
    # ".hidden" has a dot, so split gives ["", "hidden"] → ".hidden"
    assert ext_from_filename(".hidden") == ".hidden"


def test_dot_only():
    # ".".split(".", 1) gives ["", ""] → "." + "" = "."
    assert ext_from_filename(".") == "."
