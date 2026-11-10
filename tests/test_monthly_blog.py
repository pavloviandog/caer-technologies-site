import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('monthly_blog', Path(__file__).resolve().parents[1] / 'scripts/monthly_blog.py')
blog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blog)


class BlogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'blog').mkdir()
        (self.root / 'blog/index.html').write_text('<div class="blog-grid" id="blog-grid">\n<!-- existing -->', encoding='utf-8')
        (self.root / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', encoding='utf-8')
        self.post = {'title': '<script>alert(1)</script>', 'description': 'A "safe" & useful guide',
            'sections': [{'heading': 'Steps <one>', 'paragraphs': ['practical guidance ' * 100]} for _ in range(3)]}

    def test_escapes_content_and_preserves_index(self):
        blog.render(self.root, '2026-11', self.post)
        html = (self.root / 'blog/2026-11-caer-tech-guide.html').read_text(encoding='utf-8')
        self.assertNotIn('<script>alert(1)', html)
        self.assertIn('&lt;script&gt;', html)
        index = (self.root / 'blog/index.html').read_text(encoding='utf-8')
        self.assertIn('<!-- existing -->', index)
        self.assertEqual(index.count('href="2026-11-caer-tech-guide.html"'), 1)
        self.assertIn('https://consultcaer.com/blog/2026-11-caer-tech-guide.html', (self.root / 'sitemap.xml').read_text())
        with self.assertRaises(ValueError):
            blog.render(self.root, '2026-11', self.post)

    def test_changed_index_fails_before_writes(self):
        (self.root / 'blog/index.html').write_text('changed')
        with self.assertRaises(ValueError):
            blog.render(self.root, '2026-11', self.post)
        self.assertFalse((self.root / 'blog/2026-11-caer-tech-guide.html').exists())

    def test_incomplete_generation_is_rejected(self):
        self.post['sections'] = []
        with self.assertRaises(ValueError):
            blog.render(self.root, '2026-11', self.post)
        self.assertFalse((self.root / 'blog/2026-11-caer-tech-guide.html').exists())

    def test_responses_request_and_refusal(self):
        (self.root / 'about.html').write_text('CAER company reference', encoding='utf-8')
        response = {'status': 'completed', 'output': [{'type': 'message',
            'content': [{'type': 'output_text', 'text': json.dumps(self.post)}]}]}
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key', 'OPENAI_MODEL': 'test-model'}):
            with patch.object(blog, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
                self.assertEqual(blog.generate(self.root, '2026-11', 'Backups'), self.post)
                request = call.call_args.args[0]
                payload = json.loads(request.data)
                self.assertEqual(request.full_url, 'https://api.openai.com/v1/responses')
                self.assertEqual(payload['model'], 'test-model')
                self.assertTrue(payload['text']['format']['strict'])
                self.assertFalse(payload['store'])
            with patch.object(blog, 'urlopen', return_value=io.BytesIO(b'{"status":"incomplete"}')):
                with self.assertRaises(ValueError):
                    blog.generate(self.root, '2026-11', 'Backups')


if __name__ == '__main__':
    unittest.main()
