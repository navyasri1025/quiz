import unittest

from services.quiz_service import _parse_json_array


class QuizServiceParsingTests(unittest.TestCase):
    def test_extract_json_array_recovers_from_newlines_inside_strings(self):
        raw = '''Here is the result:
[
  {
    "question": "What is the capital?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "First line
second line"
  }
]
Thanks!'''

        parsed = _parse_json_array(raw)
        self.assertEqual(parsed[0]["question"], "What is the capital?")
        self.assertEqual(parsed[0]["explanation"], "First line\nsecond line")

    def test_parse_json_array_repairs_unquoted_keys_and_single_quotes(self):
        raw = """[
  {
    question: 'What is the capital?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'This is the correct answer.'
  }
]"""

        parsed = _parse_json_array(raw)
        self.assertEqual(parsed[0]["question"], "What is the capital?")
        self.assertEqual(parsed[0]["explanation"], "This is the correct answer.")


if __name__ == "__main__":
    unittest.main()
