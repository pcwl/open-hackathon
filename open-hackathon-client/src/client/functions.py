# -*- coding: utf-8 -*-
"""
This file is covered by the LICENSING file in the root of this project.
"""

import json, os, requests, urllib2
from datetime import datetime
from urlparse import parse_qs
import ssl

try:
    from config import Config
except ImportError:
    from config_sample import Config


def convert(input):
    if isinstance(input, dict):
        return {convert(key): convert(value) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [convert(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input


def get_config(key):
    ret = Config
    for arg in key.split("."):
        if arg in ret and isinstance(ret, dict):
            ret = ret[arg]
        else:
            return None
    return ret


def safe_get_config(key, default_value):
    r = get_config(key)
    return r if r is not None else default_value


def mkdir_safe(path):
    if path and not (os.path.exists(path)):
        os.makedirs(path)
    return path


def get_class(kls):
    # kls is the full name of a class obj. e.g. "hackathon.registration.Registration"
    parts = kls.split('.')
    module = ".".join(parts[:-1])
    m = __import__(module)
    for comp in parts[1:]:
        m = getattr(m, comp)
    return m


def post_to_remote(url, post_data, headers=None):
    ssl.match_hostname = lambda cert, hostname: True
    default_headers = {"content-type": "application/json"}
    if headers is not None and isinstance(headers, dict):
        default_headers.update(headers)
    req = requests.post(url, data=json.dumps(post_data), headers=default_headers)
    resp = json.loads(req.content)

    return convert(resp)


def put_to_remote(url, post_data, headers=None):
    ssl.match_hostname = lambda cert, hostname: True
    default_headers = {"content-type": "application/json"}
    if headers is not None and isinstance(headers, dict):
        default_headers.update(headers)
    req = requests.put(url, data=json.dumps(post_data), headers=default_headers)
    resp = json.loads(req.content)

    return convert(resp)


def get_remote(url, headers={}):
    ssl.match_hostname = lambda cert, hostname: True
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    request = urllib2.Request(url, None, headers)
    resp = opener.open(request)
    return resp.read()


def delete_remote(url, headers=None):
    ssl.match_hostname = lambda cert, hostname: True
    default_headers = {"content-type": "application/json"}
    if headers is not None and isinstance(headers, dict):
        default_headers.update(headers)

    opener = urllib2.build_opener(urllib2.HTTPHandler)
    request = urllib2.Request(url, headers=default_headers)
    request.get_method = lambda: 'DELETE'
    opener.open(request)

    return "OK"


def get_now():
    return datetime.utcnow()  # tzinfo=None


def qs_dict(query):
    return dict([(k, v[0]) for k, v in parse_qs(query).items()])

def is_local():
    return safe_get_config("environment", "local") == "local"