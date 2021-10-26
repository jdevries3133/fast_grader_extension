"""Rename localhost:8000 to classfast.app across the extension codebase"""

import os
from pathlib import Path


FIX_STRINGS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://0.0.0.0:8000'
]


IGNORE_SUFFIXES = ['.png']


def fix_file(f: Path):

    for sfx in IGNORE_SUFFIXES:
        if f.suffix == sfx:
            return

    with open(f, 'r') as fp:
        new = fp.read()

    for fix_s in FIX_STRINGS:
        new = new.replace(fix_s, 'https://classfast.app')

    with open(f, 'w') as fp:
        fp.write(new)


def main():
    for root, _, files in os.walk('dist'):
        for f in files:
            fix_file(Path(root, f))

if __name__ == '__main__':
    main()
