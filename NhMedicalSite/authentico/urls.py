from django.conf.urls import url,include

from authentico.views import *


urlpatterns = [

    url(r'^kayit$',login,name='login'),

]