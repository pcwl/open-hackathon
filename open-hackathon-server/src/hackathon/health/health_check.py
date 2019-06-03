# -*- coding: utf-8 -*-
"""
This file is covered by the LICENSING file in the root of this project.
"""

import sys

from hackathon.hazure.cloud_service_adapter import CloudServiceAdapter
from hackathon.hmongo.models import AzureKey, User

sys.path.append("..")
import requests
import abc

from hackathon.constants import HEALTH_STATUS
from hackathon import RequiredFeature, Component

__all__ = [
    "HostedDockerHealthCheck",
    "AlaudaDockerHealthCheck",
    "GuacamoleHealthCheck",
    "StorageHealthCheck"
]

STATUS = "status"
DESCRIPTION = "description"
VERSION = "version"


class HealthCheck(Component):
    """Base class for health check item"""
    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def report_health(self):
        pass


class MongoDBHealthCheck(HealthCheck):
    """Check the health status of MongoDB."""

    def report_health(self):
        """ Report the status by querying mongodb server info

        Will return OK if server info returned
       """
        try:
            server_info = self.db.client.server_info()
            server_info[STATUS] = HEALTH_STATUS.OK
            return server_info
        except Exception as e:
            return {
                STATUS: HEALTH_STATUS.ERROR,
                DESCRIPTION: e.message
            }


class HostedDockerHealthCheck(HealthCheck):
    """Report status of hostdd docker

    see more on docker/hosted_docker.py
    """

    def __init__(self):
        self.hosted_docker = RequiredFeature("hosted_docker_proxy")

    def report_health(self):
        return self.hosted_docker.report_health()


class AlaudaDockerHealthCheck(HealthCheck):
    """Report status of Alauda service

    see more on docker/alauda_docker.py
    """

    def __init__(self):
        self.alauda_docker = RequiredFeature("alauda_docker_proxy")

    def report_health(self):
        return self.alauda_docker.report_health()


class GuacamoleHealthCheck(HealthCheck):
    """Check the status of Guacamole Server by request its homepage"""

    def __init__(self):
        self.guacamole_url = self.util.get_config("guacamole.host") + '/guacamole'

    def report_health(self):
        try:
            req = requests.get(self.guacamole_url)
            self.log.debug(req.status_code)
            if req.status_code == 200:
                return {
                    STATUS: HEALTH_STATUS.OK
                }
        except Exception as e:
            self.log.error(e)
        return {
            STATUS: HEALTH_STATUS.ERROR
        }


class AzureHealthCheck(HealthCheck):
    """Check the status of azure to make sure config is right and azure is available"""

    def report_health(self):
        azure_key = AzureKey.objects().first()
        if not azure_key:
            return {
                STATUS: HEALTH_STATUS.WARNING,
                DESCRIPTION: "No Azure key found"
            }
        service = CloudServiceAdapter(azure_key.id)
        if service.ping():
            return {
                STATUS: HEALTH_STATUS.OK,
                "type": "Azure Storage"
            }
        else:
            return {
                STATUS: HEALTH_STATUS.ERROR
            }


class StorageHealthCheck(HealthCheck):
    """Check the status of storage"""

    def report_health(self):
        self.storage.report_health()

    def __init__(self):
        self.storage = RequiredFeature("storage")
