from django.conf.urls import url,include

from home.views import *


urlpatterns = [

    url(r'^index$',index,name='index'),

    url(r'^iletisim$',iletisim, name='iletisim'),

    url(r'^magaza$',magaza, name="magaza"),

    url(r'^urun$',urun, name="urun"),

    url(r'^sepet$',sepet, name="sepet"),

    url(r'^$', giris, name='giris'),



]