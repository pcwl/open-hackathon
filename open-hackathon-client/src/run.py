# -*- coding: utf-8 -*-
"""
This file is covered by the LICENSING file in the root of this project.
"""

#!flask/bin/python
from client import app


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80, debug=True)
