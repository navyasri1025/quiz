from config import OPENROUTER_MODEL


def test_default_openrouter_model_is_a_working_free_model():
    assert OPENROUTER_MODEL == "tencent/hy3:free"
