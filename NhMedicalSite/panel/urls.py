from django.conf.urls import url
from django.conf import settings
from panel.views import *

urlpatterns = [

    url(r'^$', index, name='index'),


]
